import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Brightness4, Logout } from "@mui/icons-material";

const Header = ({ project }) => {
  const { toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">{`Project ${project}`}</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">
            {user?.username} | {user?.role}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<Brightness4 />}
            onClick={toggleTheme}
          >
            DARK
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={logout}
          >
            LOGOUT
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
