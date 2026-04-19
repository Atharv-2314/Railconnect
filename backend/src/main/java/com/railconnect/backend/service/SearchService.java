package com.railconnect.backend.service;

import com.railconnect.backend.dto.TrainSearchResponse;
import com.railconnect.backend.entities.Schedule;
import com.railconnect.backend.entities.Seat;
import com.railconnect.backend.repositories.ScheduleRepository;
import com.railconnect.backend.repositories.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;

    @SuppressWarnings("null")
    public List<TrainSearchResponse> searchTrains(String source, String dest, LocalDate date) {
        List<Schedule> schedules;
        if (date != null) {
            schedules = scheduleRepository.findSchedulesBySourceDestAndDate(source.toUpperCase(), dest.toUpperCase(), date);
        } else {
            schedules = scheduleRepository.findSchedulesBySourceDest(source.toUpperCase(), dest.toUpperCase());
        }

        return schedules.stream().map(schedule -> {
            
            // Calculate available seats by class
            List<Seat> allAvailableSeats = seatRepository.findByScheduleAndStatus(schedule, "AVAILABLE");
            Map<String, Integer> availableSeatsByClass = new HashMap<>();
            
            for (Seat seat : allAvailableSeats) {
                availableSeatsByClass.merge(seat.getSeatClass(), 1, Integer::sum);
            }

            return TrainSearchResponse.builder()
                    .scheduleId(schedule.getScheduleId())
                    .trainNumber(schedule.getTrain().getTrainNumber())
                    .trainName(schedule.getTrain().getTrainName())
                    .trainType(schedule.getTrain().getTrainType())
                    .departure(schedule.getDepartureDatetime())
                    .arrival(schedule.getArrivalDatetime())
                    .sourceStation(source.toUpperCase())
                    .destStation(dest.toUpperCase())
                    .availableSeatsByClass(availableSeatsByClass)
                    .delayMinutes(schedule.getDelayMinutes())
                    .build();
        }).collect(Collectors.toList());
    }
}
