import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useCatalogCache = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products'); // Assumes this endpoint exists
        setProducts(res.data || []);
      } catch (err) {
        console.error('Failed to load catalog cache', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  return { products, loading };
};
