package com.railconnect.backend.service;

import com.railconnect.backend.dto.RouteStationRequest;
import com.railconnect.backend.dto.ScheduleCreationRequest;
import com.railconnect.backend.entities.Route;
import com.railconnect.backend.entities.RouteStation;
import com.railconnect.backend.entities.Schedule;
import com.railconnect.backend.entities.Seat;
import com.railconnect.backend.entities.Station;
import com.railconnect.backend.entities.Train;
import com.railconnect.backend.repositories.RouteRepository;
import com.railconnect.backend.repositories.RouteStationRepository;
import com.railconnect.backend.repositories.ScheduleRepository;
import com.railconnect.backend.repositories.SeatRepository;
import com.railconnect.backend.repositories.StationRepository;
import com.railconnect.backend.repositories.TrainRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TrainRepository trainRepository;
    private final RouteRepository routeRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;
    private final StationRepository stationRepository;
    private final RouteStationRepository routeStationRepository;

    @Transactional
    public Train saveTrain(Train train) {
        Optional<Train> existing = trainRepository.findByTrainNumber(train.getTrainNumber());
        if (existing.isPresent()) {
            Train t = existing.get();
            t.setTrainName(train.getTrainName());
            t.setTrainType(train.getTrainType());
            t.setTotalCoaches(train.getTotalCoaches());
            return trainRepository.save(t);
        }
        return trainRepository.save(train);
    }

    @Transactional
    @SuppressWarnings("null")
    public Route saveRoute(Route route) {
        return routeRepository.save(route);
    }

    @Transactional
    @SuppressWarnings("null")
    public Schedule createSchedule(ScheduleCreationRequest request) {
        Train train = trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new RuntimeException("Train not found"));
        
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));

        Schedule schedule = Schedule.builder()
                .train(train)
                .route(route)
                .journeyDate(request.getJourneyDate())
                .departureDatetime(request.getDepartureTime() != null ? 
                    request.getJourneyDate().atTime(LocalTime.parse(request.getDepartureTime())) : null)
                .arrivalDatetime(request.getArrivalTime() != null ? 
                    request.getJourneyDate().atTime(LocalTime.parse(request.getArrivalTime())) : null)
                .delayMinutes(0)
                .build();
                
        schedule = scheduleRepository.save(schedule);

        // Auto-generate seats for this schedule
        // Drastically scale down for Viva Waitlist testing
        List<Seat> seatsToSave = new ArrayList<>();
        int totalCoaches = train.getTotalCoaches() != null ? Math.min(train.getTotalCoaches(), 3) : 3;
        
        for (int coach = 1; coach <= totalCoaches; coach++) {
            String seatClass;
            String type = train.getTrainType() != null ? train.getTrainType() : "Express";
            
            if (type.equalsIgnoreCase("Rajdhani")) {
                seatClass = (coach == 1) ? "1AC" : (coach == 2 ? "2AC" : "3AC");
            } else if (type.equalsIgnoreCase("Shatabdi") || type.equalsIgnoreCase("Vande_Bharat") || type.equalsIgnoreCase("Vande Bharat")) {
                seatClass = (coach == 1) ? "EC" : "CC";
            } else {
                seatClass = (coach == 1) ? "2AC" : "SL";
            }
            
            for (int seatNum = 1; seatNum <= 5; seatNum++) {
                seatsToSave.add(Seat.builder()
                        .schedule(schedule)
                        .coachNumber(coach)
                        .seatNumber(seatNum)
                        .seatClass(seatClass)
                        .status("AVAILABLE")
                        .build());
            }
        }
        
        seatRepository.saveAll(seatsToSave);

        return schedule;
    }

    @Transactional
    @SuppressWarnings("null")
    public Station saveStation(Station station) {
        return stationRepository.save(station);
    }

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    @Transactional
    @SuppressWarnings("null")
    public String mapRouteStations(RouteStationRequest req) {
        Route route = routeRepository.findById(req.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));
        Station s1 = stationRepository.findById(req.getStation1Id())
                .orElseThrow(() -> new RuntimeException("Station 1 not found"));
        Station s2 = stationRepository.findById(req.getStation2Id())
                .orElseThrow(() -> new RuntimeException("Station 2 not found"));

        // Save stop 1
        RouteStation rs1 = new RouteStation();
        rs1.setId(new RouteStation.RouteStationId(route.getRouteId(), s1.getStationId()));
        rs1.setRoute(route);
        rs1.setStation(s1);
        rs1.setStopNumber(1);
        routeStationRepository.save(rs1);

        // Save stop 2
        RouteStation rs2 = new RouteStation();
        rs2.setId(new RouteStation.RouteStationId(route.getRouteId(), s2.getStationId()));
        rs2.setRoute(route);
        rs2.setStation(s2);
        rs2.setStopNumber(2);
        routeStationRepository.save(rs2);

        return "Stations mapped: " + s1.getStationName() + " → " + s2.getStationName() + " on Route " + route.getRouteName();
    }
}
