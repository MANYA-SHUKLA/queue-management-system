import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  alpha,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Queue as QueueIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;
const mobileDrawerWidth = 300;

// Animation variants
const menuItemVariants = {
  closed: { opacity: 0, x: -20 },
  open: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:480px)');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', color: '#6366F1' },
    { text: 'Queues', icon: <QueueIcon />, path: '/queues', color: '#10B981' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ 
      overflow: 'auto', 
      height: '100%',
      background: 'linear-gradient(180deg, #2d2b42 0%, #1e1e2d 100%)',
      color: 'white',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ p: isSmallMobile ? 2 : 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Typography 
              variant="h4" 
              component="div" 
              sx={{
                fontWeight: '800',
                background: 'linear-gradient(135deg, #818CF8 0%, #34D399 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: isSmallMobile ? '1.5rem' : '2rem',
              }}
            >
              Queue Manager
            </Typography>
          </motion.div>
          
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Avatar
                sx={{
                  width: isSmallMobile ? 40 : 50,
                  height: isSmallMobile ? 40 : 50,
                  background: 'linear-gradient(135deg, #818CF8 0%, #34D399 100%)',
                }}
              >
                <PersonIcon sx={{ fontSize: isSmallMobile ? '1.2rem' : '1.5rem' }} />
              </Avatar>
            </motion.div>
            <Box>
              <Typography variant="body1" fontWeight="600" fontSize={isSmallMobile ? '0.9rem' : '1rem'}>
                {currentUser?.username}
              </Typography>
              <Chip
                label="Manager"
                size="small"
                sx={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                  height: 20,
                  mt: 0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Navigation Menu */}
      <List sx={{ px: isSmallMobile ? 1 : 2, mt: 2 }}>
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              variants={menuItemVariants}
              initial="closed"
              animate="open"
              transition={{ delay: index * 0.1 }}
            >
              <ListItem
                button
                onMouseEnter={() => setHoveredItem(item.text)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  py: isSmallMobile ? 1 : 1.5,
                  background: location.pathname === item.path 
                    ? `linear-gradient(135deg, ${alpha(item.color, 0.2)} 0%, ${alpha(item.color, 0.1)} 100%)`
                    : 'transparent',
                  border: location.pathname === item.path 
                    ? `1px solid ${alpha(item.color, 0.3)}`
                    : '1px solid transparent',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(item.color, 0.2)} 0%, ${alpha(item.color, 0.1)} 100%)`,
                    border: `1px solid ${alpha(item.color, 0.3)}`,
                    transform: 'translateX(5px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path ? item.color : 'rgba(255,255,255,0.7)', 
                  minWidth: isSmallMobile ? 30 : 40,
                }}>
                  {React.cloneElement(item.icon, {
                    sx: { 
                      color: location.pathname === item.path ? item.color : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      fontSize: isSmallMobile ? '1.2rem' : '1.5rem',
                    }
                  })}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? '600' : '400',
                      color: location.pathname === item.path ? item.color : 'rgba(255,255,255,0.9)',
                      transition: 'all 0.3s ease',
                      fontSize: isSmallMobile ? '0.9rem' : '1rem',
                    }
                  }}
                />
                {hoveredItem === item.text && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        ml: 1,
                      }}
                    />
                  </motion.div>
                )}
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Logout Button */}
        <motion.div
          variants={menuItemVariants}
          initial="closed"
          animate="open"
          transition={{ delay: 0.3 }}
        >
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              mt: 8,
              py: isSmallMobile ? 1 : 1.5,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '&:hover': {
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                transform: 'translateX(5px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ListItemIcon sx={{ 
              color: 'rgba(239, 68, 68, 0.8)', 
              minWidth: isSmallMobile ? 30 : 40,
            }}>
              <LogoutIcon sx={{ fontSize: isSmallMobile ? '1.2rem' : '1.5rem' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              sx={{
                '& .MuiTypography-root': {
                  color: 'rgba(239, 68, 68, 0.9)',
                  fontWeight: '500',
                  fontSize: isSmallMobile ? '0.9rem' : '1rem',
                }
              }}
            />
          </ListItem>
        </motion.div>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'primary.main',
            }}
          >
            <MenuIcon />
          </IconButton>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flexGrow: 1 }}
          >
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: '600',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/queues' && 'Queue Management'}
              {location.pathname.includes('/queue/') && 'Queue Details'}
              {location.pathname.includes('/analytics/') && 'Analytics'}
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  background: 'linear-gradient(135deg, #818CF8 0%, #34D399 100%)',
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                  fontWeight: '600',
                }}
              >
                {currentUser?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: { sm: '0.875rem', md: '1rem' }
                }}
              >
                Welcome, {currentUser?.username}
              </Typography>
            </Box>
          </motion.div>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: mobileDrawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </Box>
    </Box>
  );
};

export default Layout;