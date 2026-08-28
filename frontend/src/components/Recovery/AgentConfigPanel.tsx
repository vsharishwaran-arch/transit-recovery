import React, { useState } from 'react';
import { agentApi } from '../../services/api';
import type { BatchRun } from '../../types/transit';
import { Play, Loader2, SlidersHorizontal, Globe, Route, Info } from 'lucide-react';

const ROUTES = ['all', '47C', '21B', '108', '78A', '15C'];
const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish', flag: '🇮🇳' },
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'tamil', label: 'Tamil', flag: 'த' },
];

interface Props {
  onComplete: (batchRun: BatchRun) => void;
}

const AgentConfigPanel: React.FC<Props> = ({ onComplete }) => {
  const [batchSize, setBatchSize] = useState(20);
  const [language, setLanguage] = useState('hinglish');
  const [routeFilter, setRouteFilter] = useState('all');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await agentApi.runAgent(batchSize, language, routeFilter);
      onComplete(res.data.batchRun);
    } catch (err: unknown) {
      setError('Agent failed to run. Please check the backend.');
    } finally {
      setRunning(false);
    }
  };

  const routeLabel = routeFilter === 'all' ? 'All Routes' : `Route ${routeFilter}`;

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold text-lg">Configure Recovery Agent</h3>
      </div>

      {/* Batch size */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-400 text-sm flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Batch Size
          </label>
          <span className="text-blue-300 font-bold">{batchSize} sessions</span>
        </div>
        <input
          id="batchSizeSlider"
          type="range"
          min={5}
          max={50}
          step={5}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-slate-400 text-sm flex items-center gap-1.5 mb-2">
          <Globe className="w-3.5 h-3.5" /> Message Language
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              id={`lang-${lang.value}`}
              onClick={() => setLanguage(lang.value)}
              className={`py-2 rounded-xl border text-sm font-medium transition ${
                language === lang.value
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400'
              }`}
            >
              <span className="mr-1">{lang.flag}</span>{lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Route filter */}
      <div>
        <label className="text-slate-400 text-sm flex items-center gap-1.5 mb-2">
          <Route className="w-3.5 h-3.5" /> Route Filter
        </label>
        <select
          id="routeFilter"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-400 transition"
        >
          {ROUTES.map((r) => (
            <option key={r} value={r} className="bg-slate-900">
              {r === 'all' ? 'All Routes' : `Route ${r}`}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-blue-200 text-sm">
          Agent will scan <strong>{batchSize}</strong> failed sessions on{' '}
          <strong>{routeLabel}</strong> and generate{' '}
          <strong>{LANGUAGES.find((l) => l.value === language)?.label}</strong> recovery messages.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Run button */}
      <button
        id="runRecoveryAgent"
        onClick={handleRun}
        disabled={running}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl py-4 text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30"
      >
        {running ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Agent Running... ({batchSize} sessions)
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Run Recovery Agent
          </>
        )}
      </button>
    </div>
  );
};

export default AgentConfigPanel;
