import { Provider } from 'react-redux';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import store from './app/store';
import Flowchart from './components/FlowChart';
import './App.css';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth={false} sx={{ p: 3, height: '100vh' }}>
          <Flowchart/>
        </Container>
      </ThemeProvider>
    </Provider>
  );
}

export default App;