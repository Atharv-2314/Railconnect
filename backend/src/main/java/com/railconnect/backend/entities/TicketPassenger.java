package com.railconnect.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Table(name = "Ticket_Passenger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketPassenger {

    @EmbeddedId
    private TicketPassengerId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("ticketId")
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("passengerId")
    @JoinColumn(name = "passenger_id")
    private Passenger passenger;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class TicketPassengerId implements Serializable {
        @Column(name = "ticket_id")
        private Long ticketId;

        @Column(name = "passenger_id")
        private Long passengerId;
    }
}
