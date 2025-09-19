import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col dark">
      <Header />
      
      <main className="flex-1">
        <Dashboard />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;