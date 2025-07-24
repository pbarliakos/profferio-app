import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Typography } from "@mui/material";

const SuccessAnimation = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography color="green" fontWeight={500}>
              Επιτυχής καταχώρηση!
            </Typography>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;