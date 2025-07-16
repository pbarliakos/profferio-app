import React from "react";
import { Box } from "@mui/material";

const LogoHeader = () => {
  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <img src="/Profferio.png" alt="Profferio Logo" style={{ height: "18vh", maxHeight: 160 }}
 />
    </Box>
  );
};

export default LogoHeader;
