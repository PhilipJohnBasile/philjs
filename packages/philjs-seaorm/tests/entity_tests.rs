//! Entity tests for PhilJS SeaORM integration

#[cfg(test)]
mod tests {
    use philjs_seaorm::pagination::{PaginationParams, PaginationMeta};

    #[test]
    fn test_pagination_params_default() {
        let params = PaginationParams::default();
        assert_eq!(params.page, 1);
        assert_eq!(params.per_page, 10);
    }

    #[test]
    fn test_pagination_offset() {
        let params = PaginationParams::new(3, 20);
        assert_eq!(params.offset(), 40);
    }

    #[test]
    fn test_pagination_meta_creation() {
        let params = PaginationParams::new(1, 10);
        let meta = PaginationMeta::new(params, 100);

        assert_eq!(meta.total, 100);
        assert_eq!(meta.total_pages, 10);
        assert!(!meta.has_prev);
        assert!(meta.has_next);
    }
}
