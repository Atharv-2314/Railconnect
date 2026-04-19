import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Armchair } from 'lucide-react';

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [step, setStep] = useState(1);
    const [seats, setSeats] = useState([]);
    const [selectedSeatIds, setSelectedSeatIds] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(true);
    
    const [passengers, setPassengers] = useState([]);
    const [status, setStatus] = useState({ loading: false, success: null, error: null, pnr: '', paymentStatus: '' });

    const [userProfile, setUserProfile] = useState(null);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [pointsUsed, setPointsUsed] = useState(0);

    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const res = await api.get(`/seats/${id}`);
                setSeats(res.data || []);
            } catch(e) {
                console.error(e);
            } finally {
                setLoadingSeats(false);
            }
        };
        fetchSeats();

        const fetchUserProfile = async () => {
            try {
                const res = await api.get('/user/profile');
                setUserProfile(res.data);
            } catch(e) {
                console.error("Failed fetching user profile", e);
            }
        };
        fetchUserProfile();
    }, [id]);

    const handleSeatClick = (seat) => {
        if(seat.status !== 'AVAILABLE') return;
        
        if (selectedSeatIds.includes(seat.seatId)) {
            // Deselect: remove seat AND its corresponding passenger form
            setSelectedSeatIds(selectedSeatIds.filter(sId => sId !== seat.seatId));
            setPassengers(passengers.filter(p => p._seatId !== seat.seatId));
        } else {
            if (selectedSeatIds.length >= 6) {
                setStatus({ ...status, error: "Maximum 6 seats per transaction allowed." });
                setTimeout(() => setStatus({...status, error: null}), 3000);
                return;
            }
            setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
            // Store _seatId as a hidden key for deselect matching; seatClassPreference for fare estimate display
            setPassengers([...passengers, { name: '', age: '', gender: 'M', seatClassPreference: seat.seatClass, _seatId: seat.seatId, govId: '' }]);
        }
    };

    const updatePassenger = (index, field, value) => {
        const updated = [...passengers];
        updated[index][field] = value;
        setPassengers(updated);
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: null, error: null, pnr: '', paymentStatus: '' });
        try {
            const payloadPassengers = passengers.map(p => ({...p, age: parseInt(p.age)}));
            // Step 1: Book ticket (Seat lock & logical transaction limit)
            const response = await api.post('/bookings', {
                scheduleId: parseInt(id),
                seatIds: selectedSeatIds,
                passengers: payloadPassengers,
                pointsUsed: pointsUsed
            });
            
            // Phase 20 Simplification: Payment is logically synchronous now
            setStatus({ 
                loading: false, 
                success: true, 
                error: null, 
                pnr: response.data.pnrNumber, 
                details: response.data, 
                paymentDetails: { transactionId: 'AUTO-TXN-' + Math.floor(Math.random()*1000000000) } 
            });

        } catch (err) {
            setStatus({ loading: false, success: false, error: err.response?.data?.message || 'Booking Failed. Seats taken due to high concurrency.', pnr: '' });
        }
    };

    if (status.success) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <div className="glass-panel p-10 max-w-lg w-full text-center animate-fade-in-up">
                    <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-400 mb-6">Payment of <span className="text-white font-semibold">₹{status.details?.totalFare}</span> was successful.</p>
                    <div className="bg-gray-800 p-6 rounded-xl my-6">
                        <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">PNR Number</p>
                        <p className="text-4xl font-mono font-bold text-teal-400 tracking-wider bg-black/20 py-3 rounded-lg border border-teal-500/20">{status.pnr}</p>
                        
                        {status.paymentDetails && (
                           <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-xs text-gray-400 font-mono">
                               <span>TXN: {status.paymentDetails.transactionId}</span>
                               <span>CARBON PTS: {status.details?.carbonPointsEarned}</span>
                           </div>
                        )}
                    </div>
                    <button onClick={() => navigate('/home')} className="btn-primary w-full py-3">View My Trips</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-6">Complete Your Booking</h1>
            
            {status.error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" /> {status.error}
                </div>
            )}

            {step === 1 && (
                <div className="glass-panel p-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Armchair className="text-teal-400"/> Seat Selection</h2>
                    <p className="text-gray-400 mb-8">Select your precise seating location inside the graphical coach interface.</p>
                    
                    {loadingSeats ? (
                        <div className="text-center text-gray-400 py-10 animate-pulse">Scanning Rolling Stock...</div>
                    ) : seats.length === 0 ? (
                        <div className="text-center text-red-400 py-10">Schedule data offline or Admin hasn't generated seats.</div>
                    ) : (
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {Array.from(new Set(seats.map(s => s.coachNumber))).sort((a,b) => a-b).map(coach => (
                                <div key={coach} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                    <h3 className="text-teal-400 font-bold mb-4 flex items-center border-b border-gray-800 pb-2">
                                        Coach C{coach}
                                    </h3>
                                    <div className="grid grid-cols-4 md:grid-cols-10 gap-3">
                                        {seats.filter(s => s.coachNumber === coach).map(seat => {
                                            const isSelected = selectedSeatIds.includes(seat.seatId);
                                            const isAvail = seat.status === 'AVAILABLE';
                                            return (
                                                <button 
                                                    key={seat.seatId}
                                                    disabled={!isAvail}
                                                    onClick={() => handleSeatClick(seat)}
                                                    className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                                                        isSelected ? 'bg-blue-500 shadow-lg shadow-blue-500/30 text-white scale-105' 
                                                        : isAvail ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40' 
                                                        : 'bg-red-500/10 border border-red-500/20 text-red-500/50 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Armchair className={`h-6 w-6 mb-1 ${isSelected ? 'text-white' : isAvail ? 'text-green-400' : 'text-red-500/30'}`} />
                                                    <span className="text-xs font-mono font-bold">S{seat.seatNumber}</span>
                                                    <span className="text-[10px] opacity-70">{seat.seatClass}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-800">
                        <div className="text-gray-400 text-sm">Selected: <span className="text-teal-400 font-bold">{selectedSeatIds.length}</span> / 6</div>
                        <button 
                            disabled={selectedSeatIds.length === 0}
                            onClick={() => setStep(2)}
                            className="btn-primary px-8"
                        >Proceed to Passengers</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <form onSubmit={submitBooking} className="space-y-6">
                    <div className="mb-4">
                        <button type="button" onClick={() => setStep(1)} className="text-teal-400 hover:underline text-sm flex Items-center gap-1">← Back to Seats</button>
                    </div>
                    {passengers.map((p, index) => (
                        <div key={index} className="glass-panel p-6 border-l-4 border-l-teal-500">
                            <h3 className="text-lg font-semibold text-white mb-4">Passenger {index + 1} <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded ml-2 text-teal-400">{p.seatClassPreference}</span></h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2">
                                    <input required type="text" value={p.name} onChange={(e) => updatePassenger(index, 'name', e.target.value)} className="input-field" placeholder="Full Name" />
                                </div>
                                <div className="md:col-span-1">
                                    <input required type="text" value={p.govId} onChange={(e) => updatePassenger(index, 'govId', e.target.value)} className="input-field" placeholder="Gov ID (Aadhaar/PAN)" />
                                </div>
                                <div>
                                    <input required type="number" min="1" max="120" value={p.age} onChange={(e) => updatePassenger(index, 'age', e.target.value)} className="input-field" placeholder="Age" />
                                </div>
                                <div>
                                    <select value={p.gender} onChange={(e) => updatePassenger(index, 'gender', e.target.value)} className="input-field">
                                        <option value="M">Male</option><option value="F">Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Carbon Points Section */}
                    <div className="glass-panel p-6 border-l-4 border-l-green-500">
                        <h3 className="text-lg font-semibold text-white mb-4">Apply Carbon Points</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <p className="text-gray-400 mb-2">Available Points: <span className="text-green-400 font-bold">{userProfile?.totalCarbonPoints || 0}</span></p>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={userProfile?.totalCarbonPoints || 0} 
                                        value={pointsToUse} 
                                        onChange={e => setPointsToUse(Math.min(parseInt(e.target.value) || 0, userProfile?.totalCarbonPoints || 0))} 
                                        className="input-field max-w-[200px]" 
                                    />
                                    <button type="button" onClick={() => setPointsUsed(pointsToUse)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-bold">Apply Discount</button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">1000 points = 5% discount (Max 20%)</p>
                            </div>
                            <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                {(() => {
                                    let baseFare = 0;
                                    passengers.forEach(p => {
                                        const cls = p.seatClassPreference;
                                        let mult = 0.5;
                                        if (cls === '1AC') mult = 3.5;
                                        else if (cls === '2AC') mult = 2.0;
                                        else if (cls === '3AC') mult = 1.5;
                                        else if (cls === 'SL') mult = 0.8;
                                        baseFare += 500 * mult; // Estimated locally using default 500km rules
                                    });
                                    let discountPercent = Math.min((pointsUsed / 1000) * 5, 20);
                                    let discountAmt = baseFare * (discountPercent / 100);
                                    let finalFare = baseFare - discountAmt;
                                    
                                    return (
                                        <>
                                            <div className="flex justify-between text-gray-400 mb-2 text-sm">
                                                <span>Base Fare (est.)</span>
                                                <span>₹{baseFare.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-green-400 mb-2 text-sm">
                                                <span>Discount ({discountPercent.toFixed(1)}%)</span>
                                                <span>-₹{discountAmt.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-gray-700 my-2 pt-2 flex justify-between text-white font-bold text-lg">
                                                <span>Final Price</span>
                                                <span>₹{finalFare.toFixed(2)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-8">
                        <button type="submit" disabled={status.loading} className="btn-primary px-10 py-4 text-xl shadow-teal-500/40">
                            {status.loading ? 'Processing...' : 'Confirm Reservation'}
                        </button>
                    </div>
                </form>
            )}

        </div>
    );
};

export default BookingPage;
