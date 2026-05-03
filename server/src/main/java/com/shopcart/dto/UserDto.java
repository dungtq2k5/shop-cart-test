package com.shopcart.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class UserDto {

    @Data
    public static class UpdateProfileRequest {
        @Email(message = "Email must be a valid email address")
        private String email;

        private String currentPassword;

        @Size(min = 8, message = "New password must be at least 8 characters")
        private String newPassword;
    }
}
