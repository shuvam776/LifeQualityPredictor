"use client";

import React, { useState, useEffect } from "react";

function calculateHeuristicScore(city: any) {
  const score =
    (city.aqi || 0) * -0.15 +
    (city.hospital_density || 0) * 0.20 +
    (city.school_density || 0) * 0.15 +
    (city.employment_rate || 0) * 0.15 +
    (city.internet_score || 0) * 0.10 +
    (city.green_cover || 0) * 0.10 +
    (city.cost_of_living || 0) * -0.05 +
    (city.crime_rate || 0) * -0.10 +
    (city.population_density || 0) * -0.05 +
    (city.temperature || 0) * -0.05;

  return Math.max(0, Math.min(100, Number(score.toFixed(2))));
}

export default function Dashboard() {
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<"directory" | "playground" | "diagnostics">("directory");
  const [syncingDB, setSyncingDB] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [dbLog, setDbLog] = useState<string[]>([]);
  const [backendLogs, setBackendLogs] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [selectedCityName, setSelectedCityName] = useState("");
  const [formInputs, setFormInputs] = useState<any>({
    name: "Custom City",
    aqi: null,
    temperature: null,
    humidity: null,
    crime_rate: null,
    hospital_density: null,
    school_density: null,
    internet_score: null,
    population_density: null,
    employment_rate: null,
    green_cover: null,
    cost_of_living: null,
    climate_zone: "Temperate",
    development_tier: "Tier 2",
  });

  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [heuristicScore, setHeuristicScore] = useState<number | null>(null);
  const [predicting, setPredicting] = useState(false);

  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const res = await fetch("/api/cities");
      if (res.ok) setCities(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchModelStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) setModelStatus(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchBackendLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setBackendLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchModelStatus();
    fetchBackendLogs();
    const interval = setInterval(fetchBackendLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncDB = async () => {
    setSyncingDB(true);
    setDbLog(["Seeding database with realistic city parameters..."]);
    try {
      const res = await fetch("/api/ingest/all?force=true");
      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        // Not JSON
      }

      if (res.ok) {
        setDbLog(data?.log ? [...data.log, "SUCCESS: All real-time data is updated successfully!"] : ["Done.", "SUCCESS: All real-time data is updated successfully!"]);
        setLastSynced(new Date().toLocaleTimeString());
        fetchCities();
        alert("All real-time data is updated successfully!");
      } else {
        if (data?.error && (data.error.includes("aborted") || data.error.includes("Stop requested"))) {
          setDbLog(data.log ? [...data.log, `ABORT: ${data.error}`] : [`ABORT: ${data.error}`]);
          setLastSynced(new Date().toLocaleTimeString());
          fetchCities();
          alert("Seeding stopped. Data updated up to this point.");
        } else {
          setDbLog([`Error: ${data?.error || "Seeding failed."}`]);
        }
      }
    } catch (err: any) {
      setDbLog([`Error: ${err.message || err}`]);
    } finally {
      setSyncingDB(false);
    }
  };

  const handleAbortSync = async () => {
    try {
      await fetch("/api/ingest/abort", { method: "POST" });
      setDbLog((prev) => [...prev, "ABORT: Ingestion cancellation requested..."]);
    } catch (err: any) {
      console.error("Abort error:", err);
    }
  };

  const handleTrainModel = async () => {
    setTrainingModel(true);
    try {
      const res = await fetch("/api/train", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchModelStatus();
          alert("Model trained successfully!");
        }
      } else {
        alert("Training failed. Ensure dataset.csv is exported.");
      }
    } catch (err: any) {
      alert(`Error: ${err.message || err}`);
    } finally {
      setTrainingModel(false);
    }
  };

  const handleSelectCityForPlayground = (city: any) => {
    setSelectedCityName(city.name);
    setFormInputs({
      name: city.name,
      aqi: city.aqi ?? null,
      temperature: city.temperature ?? null,
      humidity: city.humidity ?? null,
      crime_rate: city.crime_rate ?? null,
      hospital_density: city.hospital_density ?? null,
      school_density: city.school_density ?? null,
      internet_score: city.internet_score ?? null,
      population_density: city.population_density ?? null,
      employment_rate: city.employment_rate ?? null,
      green_cover: city.green_cover ?? null,
      cost_of_living: city.cost_of_living ?? null,
      climate_zone: city.climate_zone ?? "Temperate",
      development_tier: city.development_tier ?? "Tier 2",
    });
    setHeuristicScore(calculateHeuristicScore(city));
    setPredictedScore(null);
    setActiveTab("playground");
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInputs),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPredictedScore(data.predicted_score);
          setHeuristicScore(calculateHeuristicScore(formInputs));
          fetchBackendLogs();
        } else {
          alert(`Prediction failed: ${data.detail}`);
        }
      } else {
        alert("Prediction request failed.");
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-zinc-800 flex flex-col font-sans antialiased">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-900 flex items-center gap-2">
              Urban Livability Predictor
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
            </h1>
            <p className="text-xs text-emerald-700/60 mt-0.5 font-medium">
              ML &amp; Rule-Based City Evaluation Engine
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {loadingStatus ? (
              <span className="text-zinc-400">Connecting...</span>
            ) : modelStatus?.status === "ready" ? (
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  ML Online
                </span>
                <span className="block text-[10px] text-zinc-500 mt-1">
                  R² Accuracy: {modelStatus.metrics?.r2?.toFixed(4)}
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-medium">
                ML Offline
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-6 flex-grow flex flex-col gap-6">
        
        {/* Actions panel */}
        <section className="bg-white border border-emerald-100/65 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(16,185,129,0.08)] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-emerald-950 text-sm">System Management</h3>
              {lastSynced && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                  Synced: {lastSynced} (All real-time data updated)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Manage database entries and retrain the Random Forest regressor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncDB}
              disabled={syncingDB}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                syncingDB
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none opacity-60"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 hover:scale-[1.01]"
              }`}
            >
              {syncingDB ? "Seeding Database..." : "Seed Real Data"}
            </button>

            {syncingDB && (
              <button
                onClick={handleAbortSync}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 hover:scale-[1.01] transition-all duration-200"
              >
                Stop Seeding
              </button>
            )}

            <button
              onClick={handleTrainModel}
              disabled={trainingModel || modelStatus?.status === "offline"}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                trainingModel || modelStatus?.status === "offline"
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none opacity-60"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01] shadow-sm shadow-emerald-600/10"
              }`}
            >
              {trainingModel ? "Training Model..." : "Train Model"}
            </button>
          </div>
        </section>

        {dbLog.length > 0 && (
          <section className="bg-emerald-50/30 border border-emerald-100/60 rounded-lg p-3 font-mono text-xs max-h-24 overflow-y-auto text-emerald-800">
            {dbLog.map((logLine, idx) => (
              <div key={idx}>&gt; {logLine}</div>
            ))}
          </section>
        )}

        {/* Tab switcher */}
        <div className="border-b border-zinc-200/80 flex gap-2">
          {["directory", "playground", "diagnostics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab === "diagnostics" ? "Model Insights" : tab}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <section className="flex-grow">
          {activeTab === "directory" && (
            <div>
              {loadingCities ? (
                <div className="text-center py-12 text-zinc-400 text-sm animate-pulse">
                  Loading cities database...
                </div>
              ) : cities.length === 0 ? (
                <div className="text-center py-12 bg-white border border-zinc-200/80 rounded-xl">
                  <p className="text-zinc-500 text-sm">No cities in database. Run &quot;Seed Real Data&quot;.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cities.map((city) => (
                    <div
                      key={city._id}
                      className="bg-white border border-zinc-200/70 hover:border-emerald-500/40 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg text-zinc-800 transition-colors group-hover:text-emerald-900">
                              {city.name}
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {city.state}, {city.country}
                            </span>
                          </div>
                          <div className="bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-100 text-center group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                            <span className="block text-[8px] uppercase tracking-wider text-emerald-600/70 font-semibold">Score</span>
                            <span className="font-bold text-emerald-700 text-sm">{city.livability_score}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
                          <div className="flex justify-between">
                            <span>AQI:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.aqi !== null && city.aqi !== undefined ? city.aqi : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temp:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.temperature !== null && city.temperature !== undefined ? `${city.temperature.toFixed(1)}°C` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Humidity:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.humidity !== null && city.humidity !== undefined ? `${city.humidity}%` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Population:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.population !== null && city.population !== undefined ? `${(city.population / 1000000).toFixed(2)}M` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pop Density:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.population_density !== null && city.population_density !== undefined ? `${city.population_density}/km²` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Crime Rate:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.crime_rate !== null && city.crime_rate !== undefined ? city.crime_rate : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hospital Density:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.hospital_density !== null && city.hospital_density !== undefined ? city.hospital_density : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>School Density:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.school_density !== null && city.school_density !== undefined ? city.school_density : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Employment Rate:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.employment_rate !== null && city.employment_rate !== undefined ? `${city.employment_rate}%` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Internet Score:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.internet_score !== null && city.internet_score !== undefined ? city.internet_score : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Green Cover:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.green_cover !== null && city.green_cover !== undefined ? `${city.green_cover}%` : "—"}
                            </span>
                          </div>
                           <div className="flex justify-between">
                            <span>Cost Index:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.cost_of_living !== null && city.cost_of_living !== undefined ? city.cost_of_living : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Climate Zone:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.climate_zone || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dev Tier:</span>
                            <span className="font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                              {city.development_tier || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectCityForPlayground(city)}
                        className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      >
                        Adjust Features
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "playground" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form onSubmit={handlePredict} className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-xl p-5 md:p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                  <h4 className="font-semibold text-sm text-zinc-800">City Attributes Customizer</h4>
                  {selectedCityName && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                      Tuning {selectedCityName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">City Name</label>
                    <input
                      type="text"
                      value={formInputs.name}
                      onChange={(e) => setFormInputs({ ...formInputs, name: e.target.value })}
                      className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  {Object.entries(formInputs).map(([key, val]) => {
                    if (key === "name") return null;
                    if (key === "climate_zone") {
                      return (
                        <div key={key} className="space-y-1">
                          <label className="block text-[10px] text-zinc-400 uppercase tracking-wider capitalize font-semibold">
                            Climate Zone
                          </label>
                          <select
                            value={val as string || "Temperate"}
                            onChange={(e) => setFormInputs({ ...formInputs, climate_zone: e.target.value })}
                            className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          >
                            <option value="Tropical">Tropical</option>
                            <option value="Temperate">Temperate</option>
                            <option value="Arid">Arid</option>
                          </select>
                        </div>
                      );
                    }
                    if (key === "development_tier") {
                      return (
                        <div key={key} className="space-y-1">
                          <label className="block text-[10px] text-zinc-400 uppercase tracking-wider capitalize font-semibold">
                            Development Tier
                          </label>
                          <select
                            value={val as string || "Tier 2"}
                            onChange={(e) => setFormInputs({ ...formInputs, development_tier: e.target.value })}
                            className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          >
                            <option value="Tier 1">Tier 1</option>
                            <option value="Tier 2">Tier 2</option>
                            <option value="Tier 3">Tier 3</option>
                          </select>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-[10px] text-zinc-400 uppercase tracking-wider capitalize font-semibold">
                          {key.replace(/_/g, " ")}
                        </label>
                        <input
                          type="number"
                          step={key === "temperature" || key === "employment_rate" || key === "green_cover" ? "0.1" : "1"}
                          value={(val as string | number) ?? ""}
                          onChange={(e) => setFormInputs({ ...formInputs, [key]: e.target.value === "" ? null : Number(e.target.value) })}
                          className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-zinc-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCityName("");
                      setFormInputs({
                        name: "Custom City",
                        aqi: null,
                        temperature: null,
                        humidity: null,
                        crime_rate: null,
                        hospital_density: null,
                        school_density: null,
                        internet_score: null,
                        population_density: null,
                        employment_rate: null,
                        green_cover: null,
                        cost_of_living: null,
                        climate_zone: "Temperate",
                        development_tier: "Tier 2",
                      });
                      setPredictedScore(null);
                      setHeuristicScore(null);
                    }}
                    className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-500 transition-colors duration-200"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={predicting || modelStatus?.status !== "ready"}
                    className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      predicting || modelStatus?.status !== "ready"
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none opacity-60"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01] shadow-sm shadow-emerald-600/15"
                    }`}
                  >
                    {predicting ? "Running..." : "Run ML Predictor"}
                  </button>
                </div>
              </form>

              {/* Predict Output Panel */}
              <div className="lg:col-span-4">
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[250px] shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] space-y-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Evaluation Results</h4>
                  
                  {predictedScore !== null ? (
                    <div className="space-y-5 w-full">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-400 uppercase tracking-wide font-medium">Heuristic Engine</span>
                          <div className="relative w-20 h-20 mx-auto flex items-center justify-center border-2 border-emerald-200 rounded-full bg-emerald-50/50 shadow-inner">
                            <span className="text-xl font-bold text-emerald-700">{heuristicScore}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-400 uppercase tracking-wide font-medium">ML Regressor</span>
                          <div className="relative w-20 h-20 mx-auto flex items-center justify-center border-2 border-emerald-500 rounded-full bg-emerald-50 shadow-inner">
                            <span className="text-xl font-bold text-emerald-600">{predictedScore}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#fcfefe] rounded-lg p-3 text-left border border-emerald-100 text-[11px] space-y-1">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Evaluation Delta</span>
                        <p className="text-zinc-600">
                          The ML score differs from the formula score by <span className="font-bold text-emerald-600">{Math.abs(predictedScore - (heuristicScore || 0)).toFixed(2)}</span> points.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Customise attributes on the form and run model inference to see prediction outputs.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Feature importances */}
                <div className="md:col-span-8 bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-800">ML Model Feature Weights</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Shows feature relevance metrics computed by the Random Forest model.
                    </p>
                  </div>

                  {modelStatus?.feature_importances ? (
                    <div className="space-y-2.5">
                      {Object.entries(modelStatus.feature_importances).map(([name, val]: any, idx) => (
                        <div key={name} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] text-zinc-500">
                            <span className="capitalize">{name.replace(/_/g, " ")}</span>
                            <span className="font-mono text-zinc-700 font-semibold">{(val * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${val * 100}%` }}
                              className={`h-full rounded-full ${
                                idx === 0 ? "bg-emerald-600" : idx === 1 ? "bg-emerald-500" : "bg-emerald-200"
                              }`}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Train model to generate feature weights.</p>
                  )}
                </div>

                {/* Model performance summaries */}
                <div className="md:col-span-4 bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4 text-xs">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-800 text-sm">Performance Metrics</h4>
                    <div className="space-y-2 text-[11px] text-zinc-500">
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span>Trees count:</span>
                        <span className="font-mono text-zinc-700 font-semibold">50</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span>Max Depth:</span>
                        <span className="font-mono text-zinc-700 font-semibold">4</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span>MSE Loss:</span>
                        <span className="font-mono text-zinc-700 font-semibold">{modelStatus?.metrics?.mse?.toFixed(5) || "0"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span>R² Score:</span>
                        <span className="font-mono text-zinc-700 font-semibold">{modelStatus?.metrics?.r2?.toFixed(4) || "0"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fcfefe] rounded-lg p-3 text-[11px] text-zinc-500 border border-emerald-100">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-700 block mb-1">Interpretation</span>
                    An R² score above 0.95 indicates that the Random Forest model has mapped your multi-criteria normalization scoring rules with high accuracy.
                  </div>
                </div>
              </div>

              {/* Terminal Logs widget */}
              <div className="bg-[#fcfefe] border border-emerald-100/80 rounded-xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">FastAPI Backend Log Stream</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60 animate-pulse">
                    Live Polling
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 text-emerald-950/80">
                  {backendLogs.length === 0 ? (
                    <div className="text-zinc-400 italic">No log entries returned. Run predictions or model training to generate logs.</div>
                  ) : (
                    backendLogs.map((logMsg, idx) => (
                      <div key={idx} className="hover:text-emerald-950 transition-colors">{logMsg}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 bg-white py-5 mt-8 text-zinc-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2 font-medium">
          <span>Life Quality Predictor © 2026. Next.js &amp; Python FastAPI.</span>
          <div className="flex gap-4">
            <span>FastAPI: 8000</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              MongoDB Connected
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
