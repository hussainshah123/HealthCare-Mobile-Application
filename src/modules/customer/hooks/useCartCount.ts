import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { cartApi } from '../../../api/cart';

/** Number of items in the cart, refreshed whenever the screen gains focus. */
export function useCartCount() {
  const [count, setCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      cartApi
        .get()
        .then(c => {
          if (active) {
            setCount(c.items.reduce((n, i) => n + i.quantity, 0));
          }
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );
  return count;
}
