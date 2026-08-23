package com.healthcompanion.domain;
import com.fasterxml.jackson.annotation.JsonIgnore; import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="users") public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(name="first_name",nullable=false) public String firstName; @Column(name="last_name",nullable=false) public String lastName;
 @Column(nullable=false,unique=true) public String email; public String phone; @JsonIgnore @Column(name="password_hash",nullable=false) public String passwordHash;
 @Enumerated(EnumType.STRING) @Column(nullable=false) public Role role; @Column(name="created_at",nullable=false) public Instant createdAt=Instant.now();
}
