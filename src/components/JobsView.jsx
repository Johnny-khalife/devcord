import { useState, useEffect } from "react";
import { Search, Briefcase, MapPin, Building, Calendar, Tag, Clock } from "lucide-react";
import jobsData from "../data/jobs.json";

const JobsView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);

  // Get unique categories and levels from jobs
  const categories = [...new Set(jobsData.jobs.map(job => job.category))];
  const levels = [...new Set(jobsData.jobs.map(job => job.level))];

  // Initialize jobs from JSON file
  useEffect(() => {
    setJobs(jobsData.jobs);
    setFilteredJobs(jobsData.jobs);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-100 sticky top-0 z-10">
        <h2 className="text-xl font-bold mb-1">LinkedIn Jobs</h2>
        <p className="text-base-content/70 text-sm">Find your next opportunity</p>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-base-300 bg-base-100 sticky top-[73px] z-10">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location"
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category filter */}
          <select
            className="select select-bordered w-full sm:w-1/2"
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

          {/* Level filter */}
          <select
            className="select select-bordered w-full sm:w-1/2"
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

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto touch-auto">
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
    </div>
  );
};

export default JobsView; 