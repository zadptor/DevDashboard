import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  Share2, 
  RotateCcw, 
  Eye, 
  Plus, 
  Check, 
  Crown, 
  Calendar, 
  Coffee, 
  HelpCircle, 
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DECKS: Record<string, string[]> = {
  fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
  standard: ['0', '0.5', '1', '2', '3', '5', '8', '10', '20', '40', '100', '?']
};

export default function PokerRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Basic Session States
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Participant Identity (User or Guest)
  const [myParticipantId, setMyParticipantId] = useState<string>('');
  const [myParticipantName, setMyParticipantName] = useState<string>('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  // Local UX toggles
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [copyAck, setCopyAck] = useState(false);

  const currentUser = auth.currentUser;

  // 1. Establish Participant Identity
  useEffect(() => {
    if (!roomId) return;

    if (currentUser) {
      // Authenticated user
      setMyParticipantId(currentUser.uid);
      setMyParticipantName(currentUser.displayName || currentUser.email || 'Developer');
      setShowJoinDialog(false);
    } else {
      // Public / Guest user
      const stored = localStorage.getItem(`poker_guest_${roomId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMyParticipantId(parsed.id);
          setMyParticipantName(parsed.name);
          setShowJoinDialog(false);
        } catch (e) {
          setupNewGuest();
        }
      } else {
        setupNewGuest();
      }
    }

    function setupNewGuest() {
      const generatedId = 'guest_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      setMyParticipantId(generatedId);
      setShowJoinDialog(true);
    }
  }, [currentUser, roomId]);

  // 2. Attach Live Firestore Listeners once room is loaded
  useEffect(() => {
    if (!roomId || !myParticipantId) return;

    // Room Document Listener
    const unsubRoom = onSnapshot(doc(db, 'poker_sessions', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSession(data);
        setIsCreator(currentUser?.uid === data.creatorId);
        setRoomError(null);
      } else {
        setRoomError("Room could not be located in database archive.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Room listener error:", err);
      setRoomError("Relational gate denied entry. Confirm permission.");
      setLoading(false);
    });

    // Participants Listener
    const unsubParticipants = onSnapshot(collection(db, 'poker_sessions', roomId, 'participants'), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      setParticipants(list);
    });

    // Stories Listener
    const unsubStories = onSnapshot(collection(db, 'poker_sessions', roomId, 'stories'), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      // Sort stories by creation time
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setStories(list);
    });

    // Votes Listener
    const unsubVotes = onSnapshot(collection(db, 'poker_sessions', roomId, 'votes'), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      setVotes(list);
    });

    return () => {
      unsubRoom();
      unsubParticipants();
      unsubStories();
      unsubVotes();
    };
  }, [roomId, myParticipantId, currentUser]);

  // 3. Heartbeat / Presence Sync
  useEffect(() => {
    if (!roomId || !myParticipantId || !myParticipantName || showJoinDialog) return;

    // Set online status in firestore
    const participantRef = doc(db, 'poker_sessions', roomId, 'participants', myParticipantId);
    
    setDoc(participantRef, {
      id: myParticipantId,
      name: myParticipantName,
      photoURL: currentUser ? currentUser.photoURL : null,
      joinedAt: new Date().toISOString(),
      isActive: true
    }, { merge: true });

    // Cleanup on unmount or tab close: delete participant to keep table spotless
    return () => {
      deleteDoc(participantRef).catch((e) => console.log("Unmount presence cleanup bypassed:", e));
    };
  }, [roomId, myParticipantId, myParticipantName, showJoinDialog, currentUser]);

  // Sync vote locally if reset from server
  useEffect(() => {
    const activeVote = votes.find(v => v.participantId === myParticipantId);
    if (!activeVote || activeVote.vote === null) {
      setSelectedVote(null);
    } else {
      setSelectedVote(activeVote.vote);
    }
  }, [votes, myParticipantId]);

  // Guest Join Action Handler
  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;

    const guestName = nicknameInput.trim();
    localStorage.setItem(`poker_guest_${roomId}`, JSON.stringify({ id: myParticipantId, name: guestName }));
    setMyParticipantName(guestName);
    setShowJoinDialog(false);
  };

  // Participant Voting action
  const handleVoteChoice = async (val: string) => {
    if (!roomId || !myParticipantId) return;

    const voteRef = doc(db, 'poker_sessions', roomId, 'votes', myParticipantId);
    
    if (selectedVote === val) {
      // Toggle off
      setSelectedVote(null);
      await deleteDoc(voteRef);
    } else {
      setSelectedVote(val);
      await setDoc(voteRef, {
        participantId: myParticipantId,
        participantName: myParticipantName,
        vote: val,
        votedAt: new Date().toISOString()
      });
    }
  };

  // Creator Controls: Reveal Cards
  const handleRevealAll = async () => {
    if (!roomId || !isCreator) return;
    await updateDoc(doc(db, 'poker_sessions', roomId), { revealed: true });
  };

  // Creator Controls: Reset votes
  const handleResetRound = async () => {
    if (!roomId || !isCreator) return;

    try {
      // Reset revealed state on session
      await updateDoc(doc(db, 'poker_sessions', roomId), { revealed: false });

      // Clear all vote entities in votes subcollection using a Batch operation
      const votesColRef = collection(db, 'poker_sessions', roomId, 'votes');
      const votesSnap = await getDocs(votesColRef);
      const batch = writeBatch(db);
      votesSnap.forEach((voteDoc) => {
        batch.delete(voteDoc.ref);
      });
      await batch.commit();
      
      setSelectedVote(null);
    } catch (e) {
      console.error("Failed to reset votes collection synchronously:", e);
    }
  };

  // Creator Backlog Controls: Add story/ticket
  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !newStoryTitle.trim()) return;

    const storyId = 'story_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const storyRef = doc(db, 'poker_sessions', roomId, 'stories', storyId);

    const isFirstStory = stories.length === 0;

    await setDoc(storyRef, {
      id: storyId,
      title: newStoryTitle.trim(),
      description: '',
      finalEstimate: null,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    if (isFirstStory) {
      // Automatically activate first story
      await updateDoc(doc(db, 'poker_sessions', roomId), { activeStoryId: storyId });
    }

    setNewStoryTitle('');
  };

  // Creator Backlog: Select Active Story for Estimating
  const handleSelectActiveStory = async (storyId: string) => {
    if (!roomId || !isCreator) return;
    await updateDoc(doc(db, 'poker_sessions', roomId), { 
      activeStoryId: storyId,
      revealed: false // Reset revealed
    });
    // Trigger clear votes for next Estimating
    await handleResetRound();
  };

  // Creator Backlog: lock final Estimate
  const handleLockEstimate = async (storyId: string, estVal: string) => {
    if (!roomId || !isCreator) return;
    const storyDocRef = doc(db, 'poker_sessions', roomId, 'stories', storyId);
    await updateDoc(storyDocRef, {
      finalEstimate: estVal,
      status: 'completed'
    });
  };

  // Copy unique share url
  const copyShareUrl = () => {
    const shareUrl = `${window.location.origin}/poker/room/${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopyAck(true);
    setTimeout(() => setCopyAck(false), 2000);
  };

  // Computations
  const getPokerStats = () => {
    const validVotes = votes.filter(v => v.vote && v.vote !== '?' && v.vote !== '☕');
    const numericValues = validVotes.map(v => parseFloat(v.vote)).filter(n => !isNaN(n));
    
    let average: string | number = 'N/A';
    if (numericValues.length > 0) {
      const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
      average = (sum / numericValues.length).toFixed(1);
    }

    // Distribution
    const distribution: Record<string, number> = {};
    votes.forEach(v => {
      if (v.vote) {
        distribution[v.vote] = (distribution[v.vote] || 0) + 1;
      }
    });

    // Check consensus
    const uniqueVotes = Object.keys(distribution);
    const hasConsensus = uniqueVotes.length === 1 && votes.length === participants.length;

    return { average, distribution, hasConsensus };
  };

  if (loading) {
    return (
      <div className="flex bg-background h-screen justify-center items-center font-mono text-primary animate-pulse">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>INITIALIZING DIGITAL DECK SNAPSHOT...</span>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex h-screen bg-background justify-center items-center p-6">
        <Card className="max-w-md bg-card/60 border border-destructive/20 text-center backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-red-500 font-mono">CRITICAL GRID FAILURE</CardTitle>
            <CardDescription>{roomError}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">The requested Planning Poker workspace code is invalid or the security gate rejected connection.</p>
            <Button onClick={() => navigate('/poker')} className="w-full bg-primary hover:bg-primary/80">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Console Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeStory = stories.find(s => s.id === session?.activeStoryId);
  const deckCards = DECKS[session?.deckType || 'fibonacci'];
  const { average, distribution, hasConsensus } = getPokerStats();

  return (
    <div className="h-full flex flex-col md:flex-row bg-background text-foreground overflow-hidden relative font-sans animate-fade-in">
      {/* Background Glow matrices */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none" />

      {/* Main Table Screen Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-border bg-card/10 relative">
        {/* HUD top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-border gap-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/poker')}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-primary transition-all"
              title="Leave Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide text-foreground">{session?.title}</h3>
                <Badge variant="outline" className="text-[9px] border-primary/25 text-primary font-mono uppercase bg-primary/10">
                  {session?.deckType}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Host: <span className="text-primary font-mono">{session?.creatorName}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Badge variant="secondary" className="bg-muted border border-border text-xs font-mono text-primary px-3 py-1 flex items-space space-x-2">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span>{participants.length} Active</span>
            </Badge>

            <Button 
              onClick={copyShareUrl} 
              variant="outline" 
              size="sm" 
              className={`border-border hover:bg-primary/10 hover:text-primary text-xs font-mono transition-all ${copyAck ? 'text-emerald-500 border-emerald-500/30' : 'text-foreground'}`}
            >
              {copyAck ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
              {copyAck ? 'URL copied!' : 'Share Lobby'}
            </Button>
          </div>
        </div>

        {/* Estimation Target HUD */}
        <Card className="bg-card/45 backdrop-blur-md border-border mb-6 py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase text-primary tracking-wider">Estimating active Story</span>
              <h2 className="text-lg font-bold text-foreground truncate mt-1">
                {activeStory ? activeStory.title : 'Waiting for Moderator to trigger user story...'}
              </h2>
            </div>
            {isCreator && (
              <div className="flex space-x-2 ml-4">
                {session?.revealed ? (
                  <Button 
                    onClick={handleResetRound} 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-mono"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRevealAll} 
                    disabled={votes.length === 0}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono"
                  >
                    <Eye className="w-4 h-4 mr-1.5" /> Reveal Cards
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 3D Circular HUD Table & Participants */}
        <div className="flex-1 min-h-[300px] flex items-center justify-center relative py-6">
          {/* Radial HUD lines overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,currentColor_0%,transparent_70%)] text-primary opacity-5 pointer-events-none" />

          {/* Central Holographic Console Plate */}
          <div className="w-52 h-52 rounded-full border-4 border-dashed border-primary/20 flex flex-col justify-center items-center bg-card/85 relative shadow-2xl relative">
            {/* Pulsing visual halo */}
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping -z-10" />
            <div className="absolute -inset-2 rounded-full border border-primary/10 animate-pulse -z-10" />

            {session?.revealed ? (
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Consensus avg</span>
                <div className="text-4xl font-extrabold text-primary font-mono mt-0.5">
                  {average}
                </div>
                {hasConsensus && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1 uppercase text-[8px] tracking-widest font-mono">
                    Consensus reached
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs font-mono text-primary/80 uppercase block animate-pulse">Waiting...</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                  {votes.length} / {participants.length} voted
                </span>
                {/* Visual percentage ring */}
                <div className="w-16 h-1 w-full bg-muted mt-3 rounded-full overflow-hidden block">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(votes.length / Math.max(participants.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Render Participants Orbiting the circle (Dynamic angles) */}
          <div className="absolute inset-x-0 inset-y-0 pointer-events-none">
            {participants.map((player, index) => {
              const total = participants.length;
              const angle = (index * (360 / total) * Math.PI) / 180;
              const radius = 170; // Orbiting radius
              const x = Math.sin(angle) * radius;
              const y = -Math.cos(angle) * radius;

              const matchedVote = votes.find(v => v.participantId === player.id);
              const hasVoted = !!matchedVote;
              const selfInp = player.id === myParticipantId;

              return (
                <div 
                  key={player.id}
                  style={{
                    transform: `translate(calc(100% + ${x}px), calc(100% + ${y}px))`,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: '-45px', // offset width
                    marginTop: '-45px' // offset height
                  }}
                  className="w-24 h-24 flex flex-col justify-center items-center pointer-events-auto"
                >
                  {/* Participant card visual */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        {/* Orbiting Avatar Glow indicator */}
                        <div className={`w-11 h-11 rounded-full border flex items-center justify-center p-0.5 shadow-lg transition-all duration-300 ${
                          hasVoted 
                            ? 'border-primary ring-2 ring-primary/20 bg-background' 
                            : 'border-border bg-muted'
                        }`}>
                          {player.photoURL ? (
                            <img src={player.photoURL} className="w-10 h-10 rounded-full" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted text-foreground font-mono font-bold text-xs flex justify-center items-center">
                              {player.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Host crown icon */}
                        {player.id === session?.creatorId && (
                          <div className="absolute -top-1.5 -right-1 bg-amber-500 text-black rounded-full p-0.5">
                            <Crown className="w-2.5 h-2.5 fill-current" />
                          </div>
                        )}
                        
                        {/* Vote State Badge Orbit overlays */}
                        <div className="absolute -bottom-1 -right-1">
                          <AnimatePresence>
                            {hasVoted && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-md shadow-black/50 ${
                                  session?.revealed 
                                    ? 'bg-primary text-primary-foreground border border-primary/30' 
                                    : 'bg-primary text-primary-foreground animate-pulse'
                                }`}
                              >
                                {session?.revealed ? (
                                  matchedVote.vote === '☕' ? <Coffee className="w-3 h-3" /> : matchedVote.vote
                                ) : (
                                  <ClipboardCheck className="w-3 h-3" />
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <span className={`text-[10px] mt-1 font-mono font-medium tracking-wide text-center truncate max-w-[80px] ${
                        selfInp ? 'text-primary font-semibold' : 'text-foreground/85'
                      }`}>
                        {player.name} {selfInp && '(You)'}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voting controls Deck */}
        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center space-x-2 text-xs font-mono text-primary/80 mb-3 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Select Your Weighting</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {deckCards.map((card) => {
              const vAct = selectedVote === card;
              return (
                <button
                  key={card}
                  onClick={() => handleVoteChoice(card)}
                  className={`w-11 h-16 rounded-lg font-mono font-extrabold text-[15px] border cursor-pointer hover:-translate-y-2.5 flex flex-col items-center justify-between py-2 transition-all duration-300 ${
                    vAct 
                      ? 'bg-primary text-primary-foreground border-primary -translate-y-1.5 shadow-lg shadow-primary/30' 
                      : 'bg-card hover:bg-accent border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="text-[10px] self-start pl-1 opacity-60 leading-none">{card}</span>
                  <span className="text-base text-center leading-none">{card}</span>
                  <span className="text-[10px] self-end pr-1 opacity-60 leading-none rotate-180">{card}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stories & Backlog Drawer Column */}
      <div className="w-full md:w-80 bg-card/10 p-6 flex flex-col overflow-y-auto border-t md:border-t-0 border-l border-border shrink-0">
        <div className="mb-6">
          <h3 className="text-md font-bold text-foreground flex items-center space-x-2">
            <span>Room Backlog</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Queue ticket cards for collaborative estimate rounds.</p>
        </div>

        {isCreator && (
          <form onSubmit={handleAddStory} className="mb-6 space-y-2">
            <Input 
              type="text" 
              placeholder="e.g. USER-204: Add multi-region cluster" 
              value={newStoryTitle}
              onChange={(e) => setNewStoryTitle(e.target.value)}
              required
              className="bg-background/40 border-border text-xs focus-visible:ring-primary h-9"
            />
            <Button type="submit" variant="secondary" className="w-full h-9 text-xs font-mono bg-muted hover:bg-muted/80 border border-border text-primary">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Ticket
            </Button>
          </form>
        )}

        <div className="flex-1 space-y-3 max-h-[350px] overflow-auto pr-1">
          {stories.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <Info className="w-7 h-7 text-muted-foreground/35 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-mono">Backlog is currently dry</p>
            </div>
          ) : (
            stories.map((st) => {
              const activeEstimating = session?.activeStoryId === st.id;
              return (
                <div 
                  key={st.id}
                  className={`p-3 rounded-xl border transition-all duration-300 relative ${
                    activeEstimating 
                      ? 'bg-primary/5 border-primary/40 shadow-sm shadow-primary/20' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-semibold block truncate leading-tight pr-4 ${activeEstimating ? 'text-primary' : 'text-foreground'}`}>
                      {st.title}
                    </span>
                    {st.finalEstimate && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono shrink-0">
                        EST: {st.finalEstimate}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                    <span className={st.status === 'completed' ? 'text-emerald-500' : 'text-amber-500/80'}>
                      ● {st.status === 'completed' ? 'Finalized' : 'Voting Round'}
                    </span>

                    {isCreator && (
                      <div className="flex items-center space-x-1.5">
                        {!activeEstimating && st.status !== 'completed' && (
                          <button 
                            onClick={() => handleSelectActiveStory(st.id)}
                            className="p-1 px-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[8px] transition-all uppercase"
                          >
                            Activate
                          </button>
                        )}
                        {activeEstimating && session?.revealed && (
                          <div className="flex items-center space-x-1">
                            <span className="text-muted-foreground text-[8px]">Store:</span>
                            <div className="flex gap-1">
                              {['1', '3', '5', '8', '13', '21'].map(valNum => (
                                <button
                                  key={valNum}
                                  onClick={() => handleLockEstimate(st.id, valNum)}
                                  className="w-4 h-4 bg-muted hover:bg-primary hover:text-primary-foreground rounded border border-border text-[8px] flex items-center justify-center font-bold"
                                >
                                  {valNum}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Real-time stats breakdown (Revealed mode only) */}
        {session?.revealed && votes.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border animate-fade-in">
            <h4 className="text-xs font-mono uppercase text-primary mb-2">Vote Distribution</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {Object.entries(distribution).map(([vVal, count]) => {
                const percent = (count / votes.length) * 100;
                return (
                  <div key={vVal} className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Card: {vVal}</span>
                      <span>{count} votes ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                      <div 
                        className="bg-primary h-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Guest Nickname Overlay modal */}
      {showJoinDialog && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-sm w-full bg-card border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-primary animate-pulse" />
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-lg text-foreground font-mono flex items-center justify-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Join Estimation Arena</span>
              </CardTitle>
              <CardDescription>Enter a nickname to participate in voting room</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestJoin} className="space-y-4">
                <Input 
                  type="text" 
                  placeholder="e.g. Alex (UI Dev)" 
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                  className="bg-background border-border text-center text-sm focus-visible:ring-primary"
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-mono uppercase h-10 tracking-widest"
                >
                  Connect Active Sync
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
