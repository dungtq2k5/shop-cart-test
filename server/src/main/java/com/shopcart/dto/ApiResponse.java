package com.shopcart.dto;

import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * Unified API response envelope.
 *
 * <p>Using explicit factory methods instead of Lombok {@code @Builder} because
 * {@code @Builder} on a generic class produces a raw-type {@code builder()}
 * method that some Java language servers (JDT / Eclipse) cannot resolve when
 * the type parameter {@code T} is inferred from the call site, causing
 * "cannot find symbol method builder()" compile errors.</p>
 */
@Data
@RequiredArgsConstructor
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;

    // ── Factory methods ────────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
