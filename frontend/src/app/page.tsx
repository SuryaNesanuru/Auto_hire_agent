'use client';

import React, { useEffect, useState } from 'react';
import { useApplicationStore, Application } from '../stores/useStore';
import { 
  Briefcase, CheckCircle, Clock, AlertCircle, 
  UploadCloud, FileText, ChevronRight, Moon, 
  TrendingUp, Award, Layers, PlusCircle, Search,
  Settings, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { 
    applications, 
    setApplications, 
    addApplication, 
    updateApplicationStatus,
    activeApplicationId,
    setActiveApplication
  } = useApplicationStore();

  const [backendStatus, setBackendStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'settings'>('tracker');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');

  // Sample static applications for initialization if database query fails
  const initialMockApps: Application[] = [
    {
      id: "app-1",
      jobTitle: "Senior Frontend Developer (Next.js)",
      companyName: "Vercel Inc.",
      jobUrl: "https://vercel.com/careers/senior-frontend",
      status: "HITL_REVIEW",
      matchScore: 92,
      salaryRange: "$140k - $170k",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "app-2",
      jobTitle: "DevOps Platform Architect",
      companyName: "HashiCorp",
      jobUrl: "https://hashicorp.com/careers/devops-architect",
      status: "DISCOVERED",
      matchScore: 84,
      salaryRange: "$160k - $190k",
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: "app-3",
      jobTitle: "AI Python Engineer - Agents",
      companyName: "Anthropic",
      jobUrl: "https://anthropic.com/careers/ai-agent-engineer",
      status: "INTERVIEWING",
      matchScore: 89,
      salaryRange: "$180k - $220k",
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];

  useEffect(() => {
    // Check local FastAPI backend status
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'active') {
          setBackendStatus('online');
          // Fetch real applications if backend is online:
          fetch('http://localhost:8000/api/v1/jobs')
            .then(res => res.json())
            .then(appsList => {
               if (Array.isArray(appsList) && appsList.length > 0) {
                 setApplications(appsList);
               }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });

    // Populate initial state fallback if no network
    setApplications(initialMockApps);
  }, []);

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl) return;
    setIsSubmitting(true);

    try {
      // Direct POST parsing fetch target
      const response = await fetch('http://localhost:8000/api/v1/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_url: scrapeUrl,
          raw_html: "<html><body>Mock HTML content</body></html>"
        })
      });

      if (response.ok) {
        const data = await response.json();
        addApplication({
          id: data.job_id,
          jobTitle: data.job_title,
          companyName: data.company_name,
          jobUrl: scrapeUrl,
          status: 'DISCOVERED',
          matchScore: data.match_score || 85,
          salaryRange: data.salary_range || '$130k - $160k',
          created_at: new Date().toISOString()
        });
        setScrapeUrl('');
      } else {
        alert("Parsing failed. Is the FastAPI server running?");
      }
    } catch {
      // Local fallback simulation if offline
      addApplication({
        id: `mock-app-${Date.now()}`,
        jobTitle: "Senior Solutions Architect",
        companyName: "CloudCorp (Mock)",
        jobUrl: scrapeUrl,
        status: 'DISCOVERED',
        matchScore: 84,
        salaryRange: '$120k - $150k',
        created_at: new Date().toISOString()
      });
      setScrapeUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: { title: string; status: Application['status']; color: string }[] = [
    { title: 'Discovered', status: 'DISCOVERED', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
    { title: 'Tailoring', status: 'TAILORING', color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' },
    { title: 'HITL Review', status: 'HITL_REVIEW', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
    { title: 'Applied', status: 'APPLIED', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
    { title: 'Interviewing', status: 'INTERVIEWING', color: 'border-teal-500/20 bg-teal-500/5 text-teal-400' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">AutoHire AI</h1>
            <p className="text-xs text-slate-500">Autonomous Career Copilot</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server Connection Status Widget */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className={`h-2 h-2 w-2 rounded-full ${
              backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
              backendStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-slate-400 capitalize">FastAPI: {backendStatus}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab('tracker')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'tracker' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Tracker
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {activeTab === 'tracker' && (
          <>
            {/* Quick URL Ingress & PDF Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-400" />
                  <h2 className="font-semibold text-sm">Parse New Job Posting</h2>
                </div>
                <form onSubmit={handleScrapeSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="url"
                      placeholder="Paste LinkedIn, Greenhouse, or Lever Apply URL..."
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Scrape & Parse'}
                  </button>
                </form>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud className="h-5 w-5 text-indigo-400" />
                  <h2 className="font-semibold text-sm">Upload Base Resume (PDF)</h2>
                </div>
                <div className="border border-dashed border-slate-800 rounded-xl py-6 px-4 text-center cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setSelectedFile(files[0]);
                      setResumeName(files[0].name);
                    }
                  }} />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedFile ? selectedFile.name : 'Click to select resume PDF'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Maximum file size: 10MB</p>
                  </label>
                </div>
              </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {columns.map((col) => {
                const colApps = applications.filter(a => a.status === col.status);
                return (
                  <div key={col.status} className="flex-1 min-w-[250px] bg-slate-950 border border-slate-900/60 rounded-2xl flex flex-col p-4">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${col.color}`}>
                          {col.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">{colApps.length}</span>
                    </div>

                    <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                      {colApps.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-900 rounded-xl">
                          <Briefcase className="h-6 w-6 text-slate-800 mb-1" />
                          <p className="text-[10px] text-slate-600">No applications</p>
                        </div>
                      ) : (
                        colApps.map((app) => (
                          <div 
                            key={app.id}
                            onClick={() => setActiveApplication(app.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${
                              activeApplicationId === app.id
                                ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                                : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50'
                            }`}
                          >
                            <h3 className="text-xs font-semibold line-clamp-1 text-slate-200">{app.jobTitle}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">{app.companyName}</p>
                            
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40 text-[10px]">
                              <span className="text-slate-500">{app.salaryRange || 'No range'}</span>
                              {app.matchScore && (
                                <div className="flex items-center gap-1 bg-violet-950/40 text-violet-400 border border-violet-500/10 px-1.5 py-0.5 rounded font-semibold">
                                  <Award className="h-3 w-3" />
                                  <span>{app.matchScore}%</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action workflow transition parameters */}
                            {col.status === 'TAILORING' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateApplicationStatus(app.id, 'HITL_REVIEW');
                                }}
                                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-1.5 rounded-lg text-[10px] transition-colors"
                              >
                                Request HITL Review
                              </button>
                            )}
                            {col.status === 'HITL_REVIEW' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateApplicationStatus(app.id, 'APPLIED');
                                }}
                                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium py-1.5 rounded-lg text-[10px] transition-colors"
                              >
                                Approve & Set Applied
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <h2 className="font-semibold text-sm">Application Funnel</h2>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs border-b border-sidebar-border pb-1">
                  <span className="text-slate-400">Total Scoped Jobs:</span>
                  <span className="font-bold">{applications.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-sidebar-border pb-1">
                  <span className="text-slate-400">Pending Review:</span>
                  <span className="font-bold">
                    {applications.filter(a => a.status === 'HITL_REVIEW').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-sidebar-border pb-1">
                  <span className="text-slate-400">Interview Sequences:</span>
                  <span className="font-bold">
                    {applications.filter(a => a.status === 'INTERVIEWING').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-indigo-400" />
                <h2 className="font-semibold text-sm">Skills Coverage</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Python', 'React', 'Next.js', 'Typescript', 'Docker', 'Kubernetes', 'FastAPI'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-indigo-950/20 text-indigo-400 border border-indigo-500/10 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 max-w-xl mx-auto w-full flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="h-5 w-5 text-indigo-400" />
              <h2 className="font-semibold text-sm">System Configurations</h2>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Local Ollama API Endpoint</label>
              <input 
                type="text" 
                defaultValue="http://localhost:11434"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">Autonomous Apply Mode</h3>
                <p className="text-[10px] text-slate-500">Form fillings process without human approval</p>
              </div>
              <input type="checkbox" className="h-4 w-4 bg-slate-950 border-slate-800 text-indigo-600 rounded" />
            </div>

            <button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors">
              Save Configurations
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
