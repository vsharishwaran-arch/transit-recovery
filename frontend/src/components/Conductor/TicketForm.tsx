import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conductorApi } from '../../services/api';
import type { Route } from '../../types/transit';
import { useAuth } from '../../context/AuthContext';
import { Users, CreditCard, Banknote, ChevronUp, ChevronDown, IndianRupee, Loader2 } from 'lucide-react';
import api from '../../services/api';

const TicketForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/conductor/routes').then((r) => setRoutes(r.data.routes || [])).catch(() => {
      // If no routes endpoint, prefill from user's assigned route
      if (user?.assignedRoute && typeof user.assignedRoute === 'object') {
        setRoutes([user.assignedRoute as Route]);
        setSelectedRouteId((user.assignedRoute as Route)._id);
      }
    });
  }, [user]);

  // If conductor has assigned route, pre-select it
  useEffect(() => {
    if (user?.assignedRoute && typeof user.assignedRoute === 'object') {
      setSelectedRouteId((user.assignedRoute as Route)._id);
    }
  }, [user]);

  const selectedRoute = routes.find((r) => r._id === selectedRouteId) ||
    (user?.assignedRoute && typeof user.assignedRoute === 'object' ? user.assignedRoute as Route : null);

  const amount = selectedRoute ? selectedRoute.fare * passengerCount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId && !selectedRoute) {
      setError('Please select a route');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const routeId = selectedRouteId || (selectedRoute as Route)?._id;
      const busNumber = user?.assignedBus || 'TN00-XX-0000';
      const res = await conductorApi.createTicket(routeId, busNumber, passengerCount, paymentMethod);
      if (paymentMethod === 'upi') {
        navigate(`/conductor/qr/${res.data.session.sessionId}`, {
          state: { session: res.data.session, paymentLink: res.data.paymentLink, qrCode: res.data.qrCode },
        });
      } else {
        navigate('/conductor', { state: { message: `Cash ticket issued — ₹${amount}` } });
      }
    } catch (err: unknown) {
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 pt-4">
          <h1 className="text-2xl font-bold text-white">Issue Ticket</h1>
          <p className="text-blue-300 text-sm mt-1">
            {user?.name} · {user?.assignedBus || 'Bus'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Route info */}
          {selectedRoute && (
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
              <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">Route</p>
              <p className="text-white font-bold text-lg">
                {(selectedRoute as Route).routeNumber} — {(selectedRoute as Route).from} → {(selectedRoute as Route).to}
              </p>
              <p className="text-blue-200 text-sm mt-1">Base fare: ₹{(selectedRoute as Route).fare}</p>
            </div>
          )}

          {/* Passenger count stepper */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label className="block text-sm font-medium text-blue-200 mb-3">
              <Users className="inline w-4 h-4 mr-1" />
              Passengers
            </label>
            <div className="flex items-center justify-between">
              <button
                type="button"
                id="decreasePassengers"
                onClick={() => setPassengerCount((c) => Math.max(1, c - 1))}
                className="w-12 h-12 bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/30 rounded-xl flex items-center justify-center text-white transition"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-4xl font-bold text-white">{passengerCount}</span>
              <button
                type="button"
                id="increasePassengers"
                onClick={() => setPassengerCount((c) => Math.min(10, c + 1))}
                className="w-12 h-12 bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/30 rounded-xl flex items-center justify-center text-white transition"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label className="block text-sm font-medium text-blue-200 mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="payUPI"
                onClick={() => setPaymentMethod('upi')}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 border-white/20 text-blue-200 hover:border-blue-400'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">UPI / QR</span>
              </button>
              <button
                type="button"
                id="payCash"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-white/5 border-white/20 text-blue-200 hover:border-emerald-400'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-sm font-medium">Cash</span>
              </button>
            </div>
          </div>

          {/* Amount preview */}
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-blue-200 font-medium">Total Amount</span>
            <span className="text-3xl font-black text-white flex items-center">
              <IndianRupee className="w-6 h-6" />
              {amount}
            </span>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            id="generateTicket"
            type="submit"
            disabled={loading || amount === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-2xl py-4 text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              `Generate ${paymentMethod === 'upi' ? 'QR Code' : 'Cash Ticket'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
