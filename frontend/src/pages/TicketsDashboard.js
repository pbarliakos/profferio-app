import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box, Typography, Button, Paper, Chip, IconButton, Tooltip, Stack, TextField, MenuItem, Avatar, Divider
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add, Refresh, Visibility, ArrowBack, LightMode, DarkMode, Logout, Search, FilterList, Download, CalendarMonth, Close
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; 
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);

const STATUS_OPTIONS = ["Open", "In Progress", "Assigned", "Scheduled", "Reply by IT", "Waiting for Reply", "Closed"];

const getStatusColor = (status) => {
  switch (status) {
    case "Open": return "error";
    case "Assigned": return "info";
    case "In Progress": return "warning";
    case "Scheduled": return "secondary";
    case "Reply by IT": return "primary";
    case "Waiting for Reply": return "success";
    case "Closed": return "default";
    default: return "default";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "Critical": return "#d32f2f";
    case "High": return "#f44336";
    case "Medium": return "#ff9800";
    case "Low": return "#4caf50";
    default: return "#757575";
  }
};

const getSLAColor = (createdAt) => {
  const hours = dayjs().diff(dayjs(createdAt), 'hour');
  if (hours >= 48) return "#b71c1c"; 
  if (hours >= 24) return "#f44336"; 
  if (hours >= 12) return "#ff9800"; 
  return "inherit";
};

const TicketsDashboard = ({ darkMode, setDarkMode }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPrivileged = user.role === "admin" || user.role === "team leader";

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout"); } 
    catch (err) { console.error(err); } 
    finally { localStorage.clear(); navigate("/"); }
  };

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get("/api/tickets");
      setTickets(res.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    const interval = setInterval(() => { fetchTickets(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleExport = () => {
    const dataToExport = filteredTickets.map(t => ({
        ID: t.ticketId,
        Subject: t.subject,
        Category: t.category,
        Status: t.status,
        Priority: t.priority,
        CreatedBy: t.createdBy?.fullName,
        AssignedTo: t.assignedTo?.fullName || "-",
        CreatedAt: dayjs(t.createdAt).format("DD/MM/YYYY HH:mm")
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, `Tickets_Report_${dayjs().format("DD-MM-YYYY")}.xlsx`);
  };

  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <b key={i} style={{ backgroundColor: '#fff59d', color: '#000', borderRadius: '2px' }}>{part}</b> 
            : part
        )}
      </span>
    );
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const lowerSearch = searchText.toLowerCase();
      const ticketDate = dayjs(ticket.createdAt);
      
      const matchesSearch = 
        ticket.subject.toLowerCase().includes(lowerSearch) ||
        ticket.ticketId.toLowerCase().includes(lowerSearch) ||
        (ticket.description && ticket.description.toLowerCase().includes(lowerSearch));

      let matchesStatus = true;
      if (statusFilter === "Active") matchesStatus = ticket.status !== "Closed"; 
      else if (statusFilter !== "All") matchesStatus = ticket.status === statusFilter;

      const matchesDate = (!startDate || ticketDate.isAfter(dayjs(startDate).startOf('day'))) &&
                          (!endDate || ticketDate.isBefore(dayjs(endDate).endOf('day')));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [tickets, searchText, statusFilter, startDate, endDate]);

  const analyticsData = useMemo(() => {
    const statusCounts = {};
    const categoryCounts = {};
    filteredTickets.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    
    const pieData = Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] })).filter(d => d.value > 0);
    const barData = Object.keys(categoryCounts).map(name => ({ name, value: categoryCounts[name] })).filter(d => d.value > 0);
    return { pieData, barData };
  }, [filteredTickets]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#e91e63'];

  const columns = [
    { 
      field: "ticketId", headerName: "ID", width: 100,
      renderCell: (params) => (
        <Typography 
            fontWeight="bold" 
            variant="body2" 
            sx={{ color: params.row.status !== "Closed" ? getSLAColor(params.row.createdAt) : "inherit" }}
        >
            {params.value}
        </Typography>
      )
    },
    { 
      field: "subject", headerName: "Θέμα", flex: 1, minWidth: 250,
      renderCell: (params) => <HighlightText text={params.value} highlight={searchText} />
    },
    { field: "category", headerName: "Κατηγορία", width: 130 },
    { 
      field: "status", headerName: "Κατάσταση", width: 140,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" variant={params.value === "Closed" ? "outlined" : "filled"} sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} />
      )
    },
    { 
      field: "priority", headerName: "Priority", width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ bgcolor: getPriorityColor(params.value), color: 'white', fontWeight: 'bold', border: 'none', minWidth: 70, fontSize: '0.75rem' }} />
      )
    },
    { 
      field: "createdBy", headerName: "Από", width: 180,
      valueGetter: (value, row) => { const data = row || value?.row; return data?.createdBy?.fullName || "Unknown"; },
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>{params.value.charAt(0)}</Avatar>
            <Typography variant="body2" fontSize="0.8rem">{params.value}</Typography>
        </Stack>
      )
    },
    { 
        field: "assignedTo", headerName: "Assigned To", width: 180,
        valueGetter: (value, row) => { const data = row || value?.row; return data?.assignedTo?.fullName || "-"; }
    },
    { 
      field: "createdAt", headerName: "Δημιουργία", width: 150,
      valueFormatter: (value) => value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"
    },
    { 
        field: "updatedAt", headerName: "Τελευταία Ενέργεια", width: 150,
        valueFormatter: (value) => value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"
    },
    {
      field: "actions", headerName: "View", width: 70, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => navigate(`/tickets/${params.row._id}`)}><Visibility fontSize="small" /></IconButton>
      )
    }
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ width: "98%", maxWidth: "none" }}>
        
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate("/dashboard")} variant="outlined" color="inherit" size="small">Dashboard</Button>
            <Typography variant="h5" fontWeight="800">Helpdesk Tickets</Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
             <Typography variant="subtitle2" sx={{ opacity: 0.7, display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                {user.fullName} | <strong>{user.project}</strong>
             </Typography>
             {isPrivileged && (
                <Button variant="outlined" color="success" startIcon={<Download />} onClick={handleExport} size="medium">Export</Button>
             )}
             <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => navigate("/tickets/new")} size="medium">New Ticket</Button>
             <Tooltip title="Ανανέωση"><IconButton onClick={fetchTickets} color="primary"><Refresh /></IconButton></Tooltip>
             <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}><IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">{darkMode ? <LightMode /> : <DarkMode />}</IconButton></Tooltip>
             <Tooltip title="Αποσύνδεση"><IconButton onClick={handleLogout} color="error"><Logout /></IconButton></Tooltip>
          </Stack>
        </Box>

        {/* FILTER BAR */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
                <FilterList fontSize="small" color="action" />
                <Typography variant="body2" fontWeight="bold">Φίλτρα:</Typography>
            </Stack>

            <TextField size="small" placeholder="Αναζήτηση..." value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ minWidth: 250 }} />
            
            <TextField select size="small" label="Κατάσταση" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
                <MenuItem value="Active">⚡ Ανοιχτά</MenuItem>
                <MenuItem value="All">📂 Όλα</MenuItem>
                {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight="bold">ΑΠΟ:</Typography>
                <TextField type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{ width: 140 }} InputLabelProps={{ shrink: true }} />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight="bold">ΕΩΣ:</Typography>
                <TextField type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{ width: 140 }} InputLabelProps={{ shrink: true }} />
            </Stack>

            {(startDate || endDate) && (
                <IconButton size="small" onClick={() => { setStartDate(""); setEndDate(""); }} color="error">
                    <Close fontSize="small" />
                </IconButton>
            )}

            <Box flexGrow={1} />
            <Chip label={`${filteredTickets.length} Tickets`} color="primary" variant="outlined" size="small" />
        </Paper>

        {/* DATA GRID */}
        <Paper elevation={3} sx={{ width: '100%', borderRadius: 2, mb: 4, overflow: 'hidden' }}>
            <DataGrid
                rows={filteredTickets} columns={columns} getRowId={(row) => row._id}
                loading={loading} autoHeight rowHeight={52}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } }, sorting: { sortModel: [{ field: 'createdAt', sort: 'asc' }] } }}
                pageSizeOptions={[25, 50, 100]} disableRowSelectionOnClick
                sx={{ border: 'none', '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
            />
        </Paper>

        {/* ✅ ANALYTICS SECTION - FLEX LAYOUT (NO GRID) */}
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth color="primary" /> Analytics & Overview
        </Typography>
        
        {/* Χρήση Box με display: flex αντί για Grid */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, // Κάθετα σε κινητά, Οριζόντια σε PC
            gap: 3, 
            width: '100%', 
            pb: 5 
          }}
        >
            
            {/* 1. Pie Chart */}
            <Paper sx={{ flex: 1, p: 4, height: 500, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>Tickets by Status</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={analyticsData.pieData} 
                            cx="50%" cy="50%" 
                            innerRadius={80} 
                            outerRadius={140} 
                            fill="#8884d8" 
                            paddingAngle={5} 
                            dataKey="value" 
                            label
                        >
                            {analyticsData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        {/* Legend στα δεξιά για να μην πιάνει ύψος */}
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ marginRight: 20 }} />
                        <ChartTooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>

            {/* 2. Bar Chart (Horizontal) */}
            <Paper sx={{ flex: 1, p: 4, height: 500, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>Tickets by Category</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={analyticsData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={110} fontSize={13} fontWeight="bold" />
                        <ChartTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#3f51b5" radius={[0, 4, 4, 0]} barSize={40}>
                            {analyticsData.barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

        </Box>
      </Box>
    </Box>
  );
};

export default TicketsDashboard;