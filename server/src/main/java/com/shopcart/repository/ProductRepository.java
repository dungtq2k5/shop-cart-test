package com.shopcart.repository;

import com.shopcart.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
          AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')))
          AND (:priceCentsMin IS NULL OR p.priceCents >= :priceCentsMin)
          AND (:priceCentsMax IS NULL OR p.priceCents <= :priceCentsMax)
        """)
    Page<Product> findByFilters(
            @Param("name") String name,
            @Param("priceCentsMin") Integer priceCentsMin,
            @Param("priceCentsMax") Integer priceCentsMax,
            Pageable pageable);
}
