import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Clock, Navigation, ChevronRight, TrainFront, Clock3, CheckCircle } from 'lucide-react';

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningWaitlist, setJoiningWaitlist] = useState(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const source = queryParams.get('source');
  const destination = queryParams.get('destination');
  const date = queryParams.get('date');

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        let url = `/trains/search?source=${source}&destination=${destination}`;
        if (date) url += `&date=${date}`;
        const response = await api.get(url);
        setResults(response.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (source && destination) fetchTrains();
    else setLoading(false);
  }, [source, destination, date]);

  const isSoldOut = (train) =>
    !train.availableSeatsByClass || Object.keys(train.availableSeatsByClass).length === 0;

  const handleJoinWaitlist = async (scheduleId) => {
    setJoiningWaitlist(scheduleId);
    try {
      const res = await api.post('/waitlist/join', { scheduleId });
      setWaitlistSuccess(scheduleId);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not join waitlist. Please try again.');
    } finally {
      setJoiningWaitlist(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-pulse flex flex-col items-center">
          <TrainFront className="h-16 w-16 text-teal-500 mb-4 animate-bounce" />
          <span className="text-xl text-gray-400">Searching Rails...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className="font-semibold text-teal-400">{source}</span>
            <Navigation className="h-4 w-4" />
            <span className="font-semibold text-blue-400">{destination}</span>
            <span className="mx-2">•</span>
            {date
              ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : 'All Available Dates'
            }
          </p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm">
          <span className="text-teal-400 font-bold">{results.length}</span> Trains Found
        </div>
      </div>

      <div className="grid gap-6">
        {results.length === 0 ? (
          <div className="glass-panel p-12 text-center text-gray-400">
            No trains found for this route on the selected date.
          </div>
        ) : (
          results.map((train) => {
            const soldOut = isSoldOut(train);
            const joined = waitlistSuccess === train.scheduleId;
            return (
              <div key={train.scheduleId} className={`glass-panel p-6 transition-all hover:border-teal-500/30 ${soldOut ? 'border-red-500/20' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                  {/* Train Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-bold font-mono text-white">{train.trainNumber}</h3>
                      <span className="text-lg text-gray-300">{train.trainName}</span>
                      <span className="bg-teal-500/20 text-teal-400 text-xs px-2 py-1 rounded-full font-bold">
                        {train.departure ? new Date(train.departure).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                      </span>
                      {train.delayMinutes > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-bold">
                          Delayed {train.delayMinutes}m
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-teal-500" />
                        DEP: {train.departure ? new Date(train.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        ARR: {train.arrival ? new Date(train.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </div>
                      <div>Type: {train.trainType}</div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex-1 w-full bg-gray-800/50 p-4 rounded-xl flex items-center justify-around">
                    {!soldOut ? (
                      Object.entries(train.availableSeatsByClass).map(([c, count]) => (
                        <div key={c} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{c}</div>
                          <div className={`font-bold text-lg ${count > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {count > 0 ? count : 'WL'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-red-400 font-bold text-sm tracking-wider">SOLD OUT</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {soldOut ? (
                      joined ? (
                        <button disabled className="flex items-center gap-2 bg-green-500/10 border border-green-500/40 text-green-400 px-5 py-2.5 rounded-xl font-bold text-sm cursor-default">
                          <CheckCircle className="h-4 w-4" /> Waitlisted
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinWaitlist(train.scheduleId)}
                          disabled={joiningWaitlist === train.scheduleId}
                          className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/40 text-orange-400 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                          <Clock3 className="h-4 w-4" />
                          {joiningWaitlist === train.scheduleId ? 'Joining...' : 'Wait'}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => navigate(`/booking/${train.scheduleId}`)}
                        className="btn-primary flex items-center gap-2 px-6"
                      >
                        Select <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SearchPage;

