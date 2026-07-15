/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Play, Shield, Lock, CheckCircle, Server, Terminal, Copy, Check } from 'lucide-react';

interface OpenApiExplorerProps {
  token: string | null;
  onApplyToken?: (token: string) => void;
}

export default function OpenApiExplorer({ token, onApplyToken }: OpenApiExplorerProps) {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(token || '');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Active testing state for "Try it out"
  const [requestBodies, setRequestBodies] = useState<Record<string, string>>({});
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});
  const [apiResponses, setApiResponses] = useState<Record<string, { status: number; body: string }>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/openapi.json')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);

        // Prepopulate default request bodies from schema examples
        const initialBodies: Record<string, string> = {};
        if (data.paths) {
          Object.entries(data.paths).forEach(([pathKey, pathObj]: [string, any]) => {
            Object.entries(pathObj).forEach(([method, methodObj]: [string, any]) => {
              const bodyExample = methodObj.requestBody?.content?.['application/json']?.example;
              if (bodyExample) {
                initialBodies[`${method}-${pathKey}`] = JSON.stringify(bodyExample, null, 2);
              }
            });
          });
        }
        setRequestBodies(initialBodies);
      })
      .catch((err) => {
        console.error('Failed to load API Spec', err);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(id);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleTestApi = async (pathKey: string, method: string) => {
    const key = `${method}-${pathKey}`;
    setTestingEndpoint(key);

    let actualUrl = `/api${pathKey}`;
    
    // Replace path parameters (e.g., {slug} or {id}) with filled values
    const pathParams = pathKey.match(/{([^}]+)}/g);
    if (pathParams) {
      pathParams.forEach((param) => {
        const cleanName = param.replace(/[{}]/g, '');
        const value = urlParams[`${key}-${cleanName}`] || 'post_1'; // fallback
        actualUrl = actualUrl.replace(param, value);
      });
    }

    // Append query parameters if applicable (hardcoded examples for search in explorer)
    if (pathKey === '/posts' && method === 'get') {
      actualUrl += '?limit=5&page=1';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const currentToken = apiKey || token;
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const options: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (method !== 'get' && requestBodies[key]) {
      try {
        // Validate JSON prior to sending
        options.body = JSON.stringify(JSON.parse(requestBodies[key]));
      } catch (e) {
        setApiResponses((prev) => ({
          ...prev,
          [key]: { status: 400, body: 'Error: Invalid Request JSON Payload. Please correct syntax.' },
        }));
        setTestingEndpoint(null);
        return;
      }
    }

    try {
      const response = await fetch(actualUrl, options);
      const data = await response.json();
      setApiResponses((prev) => ({
        ...prev,
        [key]: {
          status: response.status,
          body: JSON.stringify(data, null, 2),
        },
      }));
    } catch (err: any) {
      setApiResponses((prev) => ({
        ...prev,
        [key]: {
          status: 500,
          body: JSON.stringify({ error: 'Network request failed', message: err.message }, null, 2),
        },
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'post': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'put': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delete': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Compiling Swagger OpenAPI definitions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction Header */}
      <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 rounded text-[10px] font-mono uppercase tracking-wider font-semibold">
              OpenAPI v3.0
            </span>
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Server size={12} />
              REST API Server Live
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{spec?.info?.title || 'Interactive API documentation'}</h2>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            {spec?.info?.description || 'Inspect models, check security scopes, and test CRUD endpoints directly inside this responsive Sandbox.'}
          </p>
        </div>
        
        {/* Token Management Console */}
        <div className="w-full md:w-80 bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Shield size={14} className="text-indigo-400" />
            <span>Authorization Security Key</span>
          </div>
          <div className="flex gap-1.5">
            <input
              type="password"
              placeholder="Bearer JWT token key..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (onApplyToken) onApplyToken(e.target.value);
              }}
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (onApplyToken && apiKey) {
                  onApplyToken(apiKey);
                  alert('Session JWT Security Token Applied Successfully.');
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs transition"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Lock size={10} />
            Include key to unlock protected Admin/Editor routes.
          </p>
        </div>
      </div>

      {/* Endpoint Explorer Paths */}
      <div className="space-y-4">
        {spec?.paths && Object.entries(spec.paths).map(([pathKey, pathObj]: [string, any]) => (
          <div key={pathKey} className="space-y-3">
            {Object.entries(pathObj).map(([method, methodObj]: [string, any]) => {
              const key = `${method}-${pathKey}`;
              const isProtected = !!methodObj.security;
              const pathParams = pathKey.match(/{([^}]+)}/g);

              return (
                <div 
                  key={key} 
                  id={`api-endpoint-${method}-${pathKey.replace(/[{}]/g, '')}`}
                  className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden transition-all hover:shadow-md hover:border-slate-200"
                >
                  {/* Summary Bar */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 border font-mono text-xs font-bold rounded uppercase ${getMethodColor(method)}`}>
                        {method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 select-all flex items-center gap-1">
                        /api{pathKey}
                        <button
                          type="button"
                          onClick={() => handleCopy(`/api${pathKey}`, key)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Copy path"
                        >
                          {copiedPath === key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">— {methodObj.summary}</span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {isProtected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded">
                          <Lock size={10} />
                          Protected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body details and sandbox tests */}
                  <div className="p-5 border-t border-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Specifications Column */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{methodObj.description || 'No description provided.'}</p>
                      </div>

                      {/* Path Param inputs */}
                      {pathParams && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Path Parameters</h4>
                          <div className="space-y-2">
                            {pathParams.map((param) => {
                              const cleanName = param.replace(/[{}]/g, '');
                              return (
                                <div key={cleanName} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{cleanName}</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder={`Enter parameter ${cleanName}...`}
                                    value={urlParams[`${key}-${cleanName}`] || ''}
                                    onChange={(e) => setUrlParams({
                                      ...urlParams,
                                      [`${key}-${cleanName}`]: e.target.value
                                    })}
                                    className="border border-slate-200 rounded px-2.5 py-1 w-64 text-xs font-mono focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Request Payload Schema */}
                      {method !== 'get' && requestBodies[key] !== undefined && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Body (JSON)</h4>
                          <textarea
                            value={requestBodies[key]}
                            onChange={(e) => setRequestBodies({
                              ...requestBodies,
                              [key]: e.target.value
                            })}
                            rows={6}
                            className="w-full font-mono text-xs bg-slate-900 text-emerald-400 p-3 rounded-lg border border-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleTestApi(pathKey, method)}
                          disabled={testingEndpoint === key}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded text-xs transition"
                        >
                          {testingEndpoint === key ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play size={13} className="fill-white" />
                          )}
                          <span>Send Test API Request</span>
                        </button>
                      </div>
                    </div>

                    {/* Responses Column / Sandbox Terminal */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2 mb-2">
                          <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <Terminal size={14} />
                            Sandbox Testing Output
                          </h4>
                          {apiResponses[key] && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              apiResponses[key].status >= 200 && apiResponses[key].status < 300 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              Status: {apiResponses[key].status}
                            </span>
                          )}
                        </div>

                        {apiResponses[key] ? (
                          <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap select-all">
                            <code>{apiResponses[key].body}</code>
                          </pre>
                        ) : (
                          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                            <CheckCircle size={28} className="text-indigo-200 mb-2" />
                            <p className="text-xs text-slate-600 font-semibold mb-0.5">Test API Interface Ready</p>
                            <p className="text-[10px] text-slate-400 max-w-xs">Fill in any required path parameters or request bodies and click Send Request to receive live server replies.</p>
                          </div>
                        )}
                      </div>

                      {/* Help documentation box inside Swagger panel */}
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-[10px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-indigo-700 flex items-center gap-1 mb-1">
                          Integration Tip:
                        </span>
                        <span>
                          Protected endpoints require submitting the JWT token in HTTP Authorization Header as:
                          <code className="bg-white px-1 py-0.5 rounded text-indigo-600 border border-indigo-200/50 font-mono ml-1 font-semibold">
                            Authorization: Bearer &lt;Token&gt;
                          </code>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
