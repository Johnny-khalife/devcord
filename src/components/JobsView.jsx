import { useState, useEffect } from "react";
import { Search, Briefcase, MapPin, Building, Calendar, Tag, Clock, X, FilterIcon, ArrowUpDown } from "lucide-react";
import jobsData from "../data/jobs.json";

const JobsView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Get unique categories and levels from jobs
  const categories = [...new Set(jobsData.jobs.map(job => job.category))];
  const levels = [...new Set(jobsData.jobs.map(job => job.level))];

  // Initialize jobs from JSON file
  useEffect(() => {
    setJobs(jobsData.jobs);
    setFilteredJobs(jobsData.jobs);
    setLoading(false);
    
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Filter jobs based on search term, category, and level
  useEffect(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    // Apply level filter
    if (selectedLevel) {
      filtered = filtered.filter(job => job.level === selectedLevel);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, selectedCategory, selectedLevel, jobs]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedLevel("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const activeFiltersCount = [
    searchTerm.trim() !== "",
    selectedCategory !== "",
    selectedLevel !== ""
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-base-100 relative">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-100 sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1">Recent Jobs</h2>
          <p className="text-base-content/70 text-sm">Find your next opportunity</p>
        </div>
        <button 
          onClick={toggleFilters}
          className="btn btn-circle btn-sm"
          aria-label="Toggle filters"
        >
          {showFilters ? <X size={18} /> : <FilterIcon size={18} />}
          {activeFiltersCount > 0 && !showFilters && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel - slides down when active */}
      <div 
        className={`bg-base-100 border-b border-base-300 transition-all duration-300 overflow-hidden z-10 ${
          showFilters ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
        }`}
      >
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location"
              className="input input-bordered w-full pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Level filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Experience Level</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm"
              disabled={!searchTerm && !selectedCategory && !selectedLevel}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto">
        {/* Results summary */}
        <div className="p-4 pb-0 flex items-center justify-between">
          <p className="text-sm text-base-content/70">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
          </p>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-xs gap-1"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-base-content/70">
              <Briefcase className="w-16 h-16 mb-4" />
              <p className="text-xl font-semibold mb-2">No jobs found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredJobs.map((job, index) => (
              <div 
                key={index} 
                className="card bg-base-200 hover:bg-base-300 transition-colors shadow-sm"
              >
                <div className="card-body p-4">
                  {/* Header with title and level badge */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="card-title text-lg">{job.title}</h3>
                    <span className={`badge ${
                      job.level === 'senior' ? 'badge-primary' :
                      job.level === 'mid' ? 'badge-secondary' :
                      job.level === 'junior' ? 'badge-accent' :
                      job.level === 'intern' ? 'badge-info' :
                      job.level === 'lead' ? 'badge-warning' :
                      'badge-ghost'
                    } badge-lg capitalize whitespace-nowrap`}>
                      {job.level}
                    </span>
                  </div>

                  {/* Job details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Building className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-base-content/70">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{job.jobType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Tag className="w-4 h-4 flex-shrink-0" />
                      <span>{job.category}</span>
                    </div>
                  </div>

                  {/* Apply button */}
                  <div className="card-actions justify-end mt-auto">
                    <a 
                      href={job.applicationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile padding to account for bottom navigation */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
};

export default JobsView; 