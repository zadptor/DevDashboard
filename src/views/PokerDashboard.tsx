import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  setDoc,
  doc 
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, 
  Play, 
  ArrowRight, 
  Layers, 
  Clock, 
  User, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function PokerDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [deckType, setDeckType] = useState<'fibonacci' | 'tshirt' | 'standard'>('fibonacci');
  const [roomCodeToJoin, setRoomCodeToJoin] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  // Fetch rooms created by current user
  useEffect(() => {
    if (!currentUser) return;
    
    async function fetchSessions() {
      const q = query(
        collection(db, 'poker_sessions'),
        where('creatorId', '==', currentUser?.uid),
        orderBy('createdAt', 'desc')
      );
      
      try {
        const querySnapshot = await getDocs(q);
        const rooms: any[] = [];
        querySnapshot.forEach((docSnap) => {
          rooms.push({ id: docSnap.id, ...docSnap.data() });
        });
        setSessions(rooms);
      } catch (err) {
        console.error("Error loading sessions:", err);
        // Fallback: fetch without index ordering if indexing fails initially
        try {
          const qSimple = query(
            collection(db, 'poker_sessions'),
            where('creatorId', '==', currentUser?.uid)
          );
          const simpleSnap = await getDocs(qSimple);
          const rooms: any[] = [];
          simpleSnap.forEach((d) => rooms.push({ id: d.id, ...d.data() }));
          // Sort client side
          rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSessions(rooms);
        } catch (innerErr) {
          setErrorStatus("Unable to load rooms. Please check connection.");
          handleFirestoreError(innerErr, OperationType.LIST, 'poker_sessions');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchSessions();
  }, [currentUser]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    setCreateLoading(true);
    setErrorStatus(null);
    const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newRoom = {
      id: roomId,
      title: title.trim(),
      deckType,
      creatorId: currentUser.uid,
      creatorName: currentUser.displayName || currentUser.email || 'Host',
      activeStoryId: '',
      revealed: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'poker_sessions', roomId), newRoom);
      
      // Auto register the creator as a participant
      const participantRef = doc(db, 'poker_sessions', roomId, 'participants', currentUser.uid);
      await setDoc(participantRef, {
        id: currentUser.uid,
        name: currentUser.displayName || 'Creator',
        photoURL: currentUser.photoURL || null,
        joinedAt: new Date().toISOString(),
        isActive: true
      });

      navigate(`/poker/room/${roomId}`);
    } catch (err) {
      setErrorStatus("Failed to build virtual room. Confirm permission.");
      handleFirestoreError(err, OperationType.CREATE, `poker_sessions/${roomId}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDirectJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeToJoin.trim()) return;
    navigate(`/poker/room/${roomCodeToJoin.trim().toUpperCase()}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col relative animate-fade-in">
      {/* Glow Ambient background */}
      <div className="absolute right-10 top-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl -z-10" />
      <div className="absolute left-10 bottom-10 w-96 h-96 rounded-full bg-violet-600/5 blur-3xl -z-10" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Distributed Agile Toolplane</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Real-Time Estimator (Planning Poker)</h2>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Instantly run card estimation session. Share unique URLs with teammates (no limit), and run consensus voting with fully synced animations.
        </p>
      </div>

      {errorStatus && (
        <div className="mb-6 flex items-center space-x-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Create and Join form controls */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card/40 border-border backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Initialize Session</span>
              </CardTitle>
              <CardDescription>Setup a brand new public-shareable poker deck</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted-foreground">Session Title</label>
                  <Input 
                    type="text" 
                    placeholder="e.g., Sprint 42 Backlog Refinement" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-background/60 border-border focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-muted-foreground block">Deck Sequence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fibonacci', 'tshirt', 'standard'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeckType(type)}
                        className={`p-2.5 rounded-lg border text-xs font-medium uppercase transition-all flex flex-col items-center justify-center space-y-1 ${
                          deckType === type 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20' 
                            : 'bg-background/40 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 mb-1" />
                        <span className="text-[10px] tracking-wide">{type}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground bg-background/30 p-2 border border-border rounded font-mono">
                    {deckType === 'fibonacci' && '0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕'}
                    {deckType === 'tshirt' && 'XS, S, M, L, XL, XXL, ?, ☕'}
                    {deckType === 'standard' && '0, 0.5, 1, 2, 3, 5, 8, 10, 20, 40, 100, ?'}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={createLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-md shadow-cyan-950/50"
                >
                  {createLoading ? 'Carving Room...' : 'Deploy Poker Lobby'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Join Existing Session</CardTitle>
              <CardDescription>Enter code to quickly join ongoing session as player</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDirectJoin} className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="e.g. RFY6B92" 
                  value={roomCodeToJoin}
                  onChange={(e) => setRoomCodeToJoin(e.target.value)}
                  className="font-mono text-center uppercase tracking-wider bg-background/60 border-border focus-visible:ring-cyan-500"
                />
                <Button type="submit" variant="secondary" className="px-3">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Rooms List */}
        <div className="md:col-span-2">
          <Card className="bg-card/40 border-border backdrop-blur-md h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Your Spawned Rooms</CardTitle>
                  <CardDescription>Review estimation sessions created by you</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">
                  {sessions.length} Rooms
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[480px] space-y-3">
              {loading ? (
                <div className="text-center py-10 text-sm text-muted-foreground">Scanning database logs...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No sessions created yet</p>
                  <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto mt-1">
                    Fill out the Left Panel to kickstart an estimation poker room and share its URL instantly!
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => navigate(`/poker/room/${session.id}`)}
                    className="flex items-center justify-between p-4 bg-background/30 hover:bg-muted/40 border border-border hover:border-primary/40 rounded-xl transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors text-ellipsis overflow-hidden block">
                          {session.title}
                        </span>
                        <Badge variant="secondary" className="text-[9px] font-mono uppercase bg-cyber">
                          {session.deckType}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center font-mono">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">
                          CODE: {session.id}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <Play className="w-4 h-4 fill-current mr-1" /> Join
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
