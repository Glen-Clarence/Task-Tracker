import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, RefreshCw, Copy, Eye, EyeOff, Edit2, Folder, X, Sun, Moon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const SecretVault = () => {
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [repositories, setRepositories] = useState([
    {
      id: 1,
      name: "frontend-app",
      environments: {
        development: {
          "API_URL": "http://localhost:3000",
          "DATABASE_URL": "postgres://localhost:5432/dev",
          "JWT_SECRET": "dev-secret-key-123"
        },
        staging: {
          "API_URL": "https://staging-api.example.com",
          "DATABASE_URL": "postgres://staging.db.example.com:5432/staging",
          "JWT_SECRET": "staging-secret-key-xyz"
        },
        production: {
          "API_URL": "https://api.example.com",
          "DATABASE_URL": "postgres://prod.db.example.com:5432/prod",
          "JWT_SECRET": "prod-secret-key-abc"
        }
      }
    },
    {
      id: 2,
      name: "backend-api",
      environments: {
        development: {
          "PORT": "8000",
          "REDIS_URL": "redis://localhost:6379",
          "STRIPE_SECRET_KEY": "sk_test_123456789"
        },
        staging: {
          "PORT": "8000",
          "REDIS_URL": "redis://staging.cache.example.com:6379",
          "STRIPE_SECRET_KEY": "sk_test_staging_987654321"
        },
        production: {
          "PORT": "8000",
          "REDIS_URL": "redis://prod.cache.example.com:6379",
          "STRIPE_SECRET_KEY": "sk_live_prod_abcdefgh"
        }
      }
    },
    {
      id: 3,
      name: "microservice-auth",
      environments: {
        development: {
          "OAUTH_CLIENT_ID": "dev_client_123",
          "OAUTH_CLIENT_SECRET": "dev_client_secret_xyz",
          "SESSION_SECRET": "dev_session_secret"
        },
        staging: {
          "OAUTH_CLIENT_ID": "staging_client_456",
          "OAUTH_CLIENT_SECRET": "staging_client_secret_abc",
          "SESSION_SECRET": "staging_session_secret"
        }
      }
    }
  ]);

  const [newSecret, setNewSecret] = useState({
    repository: '',
    environment: 'development',
    key: '',
    value: ''
  });

  const [visibilityState, setVisibilityState] = useState({});

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(repo.environments).some(env =>
      Object.keys(env).some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const copySecret = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleVisibility = (repoId, env, key) => {
    const stateKey = `${repoId}-${env}-${key}`;
    setVisibilityState(prev => ({
      ...prev,
      [stateKey]: !prev[stateKey]
    }));
  };

  const downloadSecrets = () => {

  };

  const addSecret = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

  };

  const getBadgeClass = (env: string) => {
    switch (env) {
      case 'development': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'staging': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'production': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Secrets Overview</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your application secrets and environment variables
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              {/* <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} /> */}
              <Input
                type="text"
                placeholder="Search by secret or repository name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // className={`pl-10 pr-4 py-2 w-80 rounded-lg border transition-colors ${
                //   theme === 'dark'
                //     ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                //     : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                // } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

            {/* Add Secret Button */}
            <Button
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-4 h-4" />
              Add Secret
            </Button>

            {/* Theme Toggle */}
            {/* <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button> */}
          </div>
        </div>

        {/* Repository Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRepositories.map(repo => (
            <div
              key={repo.id}
              className={`rounded-xl p-6 border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:shadow-gray-900/25'
                  : 'bg-white border-gray-100 hover:shadow-gray-200/50'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Folder className="w-5 h-5" />
                  {repo.name}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => downloadSecrets()}
                    className={`p-1.5 rounded hover:bg-opacity-80 transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    title="Download secrets"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className={`p-1.5 rounded hover:bg-opacity-80 transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Environment Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(repo.environments).map(env => (
                  <span
                    key={env}
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getBadgeClass(env)}`}
                  >
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </span>
                ))}
              </div>

              {/* Secrets List */}
              <div className="space-y-2">
                {Object.entries(repo.environments).map(([env, secrets]) =>
                  Object.entries(secrets).map(([key, value]) => {
                    const stateKey = `${repo.id}-${env}-${key}`;
                    const isVisible = visibilityState[stateKey as keyof typeof visibilityState];
                    
                    return (
                      <div
                        key={`${env}-${key}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium truncate">
                            {key}
                          </div>
                          <div className={`font-mono text-xs mt-1 truncate ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {isVisible ? value : '●'.repeat(Math.min(value.length as number, 20))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => copySecret(value as string)}
                            className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => toggleVisibility(repo.id, env, key)}
                            className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Toggle visibility"
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Secret Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Secret</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Repository</label>
                  <select
                    value={newSecret.repository}
                    onChange={(e) => setNewSecret({ ...newSecret, repository: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="">Select Repository</option>
                    {repositories.map(repo => (
                      <option key={repo.id} value={repo.id}>{repo.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Environment</label>
                  <select
                    value={newSecret.environment}
                    onChange={(e) => setNewSecret({ ...newSecret, environment: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <input
                    type="text"
                    value={newSecret.key}
                    onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
                    placeholder="API_KEY"
                    className={`w-full p-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Value</label>
                  <input
                    type="password"
                    value={newSecret.value}
                    onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                    placeholder="Enter secret value"
                    className={`w-full p-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newSecret.repository && newSecret.key && newSecret.value) {
                        addSecret({ preventDefault: () => {} });
                      }
                    }}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Secret
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretVault;