import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  Fade,
  CircularProgress,
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  RocketLaunch,
  Dashboard,
  Group,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      duration: 0.8
    }
  }
};

const floatingVariants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const gradientText = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 50%, #f5576c 70%, #4facfe 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundSize: '300% 300%',
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <motion.div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      key={`tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </motion.div>
  );
}

const Login = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (activeTab === 0) {
      result = await login(username, password);
    } else {
      result = await register(username, password);
    }

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Animated background elements */}
      <AnimatePresence>
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top: `${20 + i * 10}%`,
              left: `${i * 15}%`,
              width: 100 + i * 40,
              height: 100 + i * 40,
              borderRadius: '50%',
              background: `linear-gradient(45deg, 
                rgba(255,255,255,${0.05 * i}), 
                rgba(0,0,0,${0.02 * i})
              )`,
              zIndex: 0,
            }}
            variants={floatingVariants}
            initial="animate"
            animate="animate"
            transition={{ duration: 3 + i, repeat: Infinity }}
          />
        ))}
      </AnimatePresence>

      {/* Floating icons */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15%',
          right: '15%',
        }}
        variants={floatingVariants}
        animate="animate"
      >
        <RocketLaunch sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
      </motion.div>

      <motion.div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
        }}
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 0.5 }}
      >
        <Dashboard sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
      </motion.div>

      <motion.div
        style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
        }}
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1 }}
      >
        <Group sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        whileHover={{ 
          scale: 1.02,
          rotate: 0,
          transition: { duration: 0.3 }
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            width: 420,
            maxWidth: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe)',
              backgroundSize: '300% 300%',
              animation: 'gradientShift 3s ease infinite',
            },
            '@keyframes gradientShift': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            }
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="800"
                  sx={{
                    ...gradientText,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    mb: 1,
                  }}
                >
                  QueueFlow
                </Typography>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: '1.1rem'
                  }}
                >
                  Streamline your queue management with style
                </Typography>
              </motion.div>
            </Box>

            {/* Tabs Section */}
            <motion.div variants={itemVariants}>
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                borderRadius: 2,
                p: 0.5,
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  centered
                  sx={{
                    '& .MuiTab-root': {
                      fontWeight: '600',
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderRadius: 2,
                      minHeight: 48,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      },
                    },
                  }}
                >
                  <Tab label="Sign In" />
                  <Tab label="Create Account" />
                </Tabs>
              </Box>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <TabPanel value={activeTab} index={0}>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Username"
                      variant="outlined"
                      margin="normal"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      margin="normal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                              sx={{ color: 'text.secondary' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{ 
                        mt: 3,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          boxShadow: '0 12px 30px rgba(102, 126, 234, 0.6)',
                          transform: 'translateY(-2px)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        <>
                          Sign In
                          <Box component="span" sx={{ ml: 1, fontSize: '1.2rem' }}>→</Box>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Username"
                      variant="outlined"
                      margin="normal"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      margin="normal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                              sx={{ color: 'text.secondary' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      }}
                    />
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{ 
                        mt: 3,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                          boxShadow: '0 12px 30px rgba(79, 172, 254, 0.6)',
                          transform: 'translateY(-2px)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        <>
                          Create Account
                          <Box component="span" sx={{ ml: 1, fontSize: '1.2rem' }}>🚀</Box>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </TabPanel>
              </AnimatePresence>
            </form>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
            >
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                  {activeTab === 0 ? "Don't have an account? " : "Already have an account? "}
                  <Box
                    component="span"
                    onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
                    sx={{
                      color: 'primary.main',
                      fontWeight: '600',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {activeTab === 0 ? 'Sign up now' : 'Sign in'}
                  </Box>
                </Typography>
              </Box>
            </motion.div>
          </motion.div>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;