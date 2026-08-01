import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

const AnimatedCounter = ({ value = 0, prefix = '₹ ' }) => {
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 80, damping: 20 });
  const display = useTransform(rounded, (latest) => `${prefix}${Math.round(latest).toLocaleString()}`);

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
};

export default AnimatedCounter;
