import React, { useEffect, useState, useCallback } from 'react';
import { recoveryApi } from '../../services/api';
import type { RecoveryStats, TicketSession, RecoveryLog, BatchRun, BatchDetail } from '../../types/transit';
import { useAuth } from '../../context/AuthContext';
import RecoveryStatsComponent from './RecoveryStats';
import FailureBreakdown from './FailureBreakdown';
import SessionsTable from './SessionsTable';
import BatchResultsPanel from './BatchResultsPanel';
import EscalatedQueue from './EscalatedQueue';
import AgentConfigPanel from './AgentConfigPanel';
import BatchHistoryTable from './BatchHistoryTable';
import { Bot, LogOut, X } from 'lucide-react';

type Tab = 'sessions' | 'escalated' | 'history';

const RecoveryDashboard: React.FC = () => {
  const { logout } = useAuth();

  // Stats
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sessions tab
  const [sessions, setSessions] = useState<TicketSession[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Escalated tab
  const [escalated, setEscalated] = useState<RecoveryLog[]>([]);
  const [escalatedLoading, setEscalatedLoading] = useState(false);

  // Batch history tab
  const [batches, setBatches] = useState<BatchRun[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Batch detail
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [showBatchResult, setShowBatchResult] = useState(false);

  // Agent modal
  const [showAgent, setShowAgent] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>('sessions');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await recoveryApi.getStats();
      setStats(res.data.stats);
    } catch {}
    setStatsLoading(false);
  }, []);

  const loadSessions = useCallback(async (page: number) => {
    setSessionsLoading(true);
    try {
      const res = await recoveryApi.getFailedSessions({ page, limit: 20 });
      setSessions(res.data.sessions);
      setSessionsTotal(res.data.total);
    } catch {}
    setSessionsLoading(false);
  }, []);

  const loadEscalated = useCallback(async () => {
    setEscalatedLoading(true);
    try {
      const res = await recoveryApi.getEscalated();
      setEscalated(res.data.escalated);
    } catch {}
    setEscalatedLoading(false);
  }, []);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const res = await recoveryApi.getBatchHistory();
      setBatches(res.data.batches);
    } catch {}
    setBatchesLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    loadSessions(1);
    loadEscalated();
    loadBatches();
  }, [loadStats, loadSessions, loadEscalated, loadBatches]);

  const handleAgentComplete = async (batchRun: BatchRun) => {
    setShowAgent(false);
    try {
      const res = await recoveryApi.getBatchDetail(batchRun.batchRunId);
      setBatchDetail({ batch: res.data.batch, logs: res.data.logs });
      setShowBatchResult(true);
    } catch {
      setBatchDetail({ batch: batchRun, logs: [] });
      setShowBatchResult(true);
    }
    loadStats();
    loadSessions(1);
    loadEscalated();
    loadBatches();
  };

  const handleSelectBatch = async (batchRunId: string) => {
    try {
      const res = await recoveryApi.getBatchDetail(batchRunId);
      setBatchDetail({ batch: res.data.batch, logs: res.data.logs });
      setShowBatchResult(true);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-400" />
              Transit Recovery Agent
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              AI-powered UPI failure recovery · TNSTC Tamil Nadu
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="openAgentModal"
              onClick={() => setShowAgent(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Run Recovery Agent
            </button>
            <button
              id="logoutBtn"
              onClick={logout}
              className="text-slate-400 hover:text-white transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <RecoveryStatsComponent stats={stats} loading={statsLoading} />

        {/* Charts + last batch */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <FailureBreakdown stats={stats} loading={statsLoading} />
          </div>
          <div className="lg:col-span-2">
            {showBatchResult && batchDetail ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Last Batch</h3>
                  <button onClick={() => setShowBatchResult(false)}>
                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
                <BatchResultsPanel
                  batchRun={batchDetail.batch}
                  logs={batchDetail.logs}
                  onRunAnother={() => { setShowBatchResult(false); setShowAgent(true); }}
                />
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center h-full gap-3 min-h-48">
                <Bot className="w-10 h-10 text-blue-400/50" />
                <p className="text-slate-500 text-sm text-center">
                  Run the recovery agent to see results here
                </p>
                <button
                  onClick={() => setShowAgent(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Run now →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {(['sessions', 'escalated', 'history'] as Tab[]).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-400 -mb-px'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'sessions' ? 'Failed Sessions' :
                 tab === 'escalated' ? `Escalated ${escalated.length > 0 ? `(${escalated.length})` : ''}` :
                 'Batch History'}
              </button>
            ))}
          </div>
          <div className="p-5">
            {activeTab === 'sessions' && (
              <SessionsTable
                sessions={sessions}
                loading={sessionsLoading}
                total={sessionsTotal}
                page={sessionsPage}
                onPageChange={(p) => { setSessionsPage(p); loadSessions(p); }}
              />
            )}
            {activeTab === 'escalated' && (
              <EscalatedQueue
                escalated={escalated}
                loading={escalatedLoading}
                onRefresh={loadEscalated}
              />
            )}
            {activeTab === 'history' && (
              <BatchHistoryTable
                batches={batches}
                loading={batchesLoading}
                onSelectBatch={handleSelectBatch}
              />
            )}
          </div>
        </div>
      </main>

      {/* Agent config modal */}
      {showAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="flex justify-end mb-2">
              <button
                id="closeAgentModal"
                onClick={() => setShowAgent(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <AgentConfigPanel onComplete={handleAgentComplete} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryDashboard;
