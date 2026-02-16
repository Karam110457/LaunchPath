/**
 * Niche agent registry — 10 pre-built agents for demo pages.
 * Each agent has a system prompt, form fields, and structured output expectations.
 */

import type { AgentConfig } from "./types";

const DEMO_OUTPUT_SCHEMA = `Return ONLY valid JSON matching this structure:
{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "score": number (0-100),
  "estimated_value": "string — monetary value estimate",
  "fit_analysis": { "key": "value" — 3-5 key assessment dimensions },
  "insights": ["string — 3-5 specific observations about this lead/request"],
  "next_steps": ["string — 2-3 recommended actions"]
}`;

export const NICHE_AGENTS: Record<string, AgentConfig> = {
  roofing: {
    id: "roofing",
    niche: "Roofing",
    name: "Roofing Lead Qualifier",
    description: "Scores roofing leads by job size, urgency, and location fit.",
    systemPrompt: `You are a roofing lead qualification AI. You analyse incoming enquiries for roofing companies and determine lead quality, estimated job value, and priority.

## How to Score
- Job value: residential re-roofs ($8,000-$35,000), commercial ($20,000-$100,000+), repairs ($500-$5,000)
- Urgency: "ASAP" or active leak = HIGH; "this month" = MEDIUM; "next few months" = LOW
- Size matters: larger sqft = higher value
- Location: in-service-area = bonus; outside = penalty

## Priority Rules
- HIGH (80-100): Large job + urgent + in area
- MEDIUM (50-79): Decent job or moderate urgency
- LOW (0-49): Small repair, no urgency, or outside area

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "John Smith", required: true },
      { key: "company", label: "Company name", type: "text", placeholder: "Smith's Roofing Co", required: false },
      { key: "location", label: "Job location", type: "text", placeholder: "e.g., Tampa, FL", required: true },
      { key: "job_type", label: "Type of work needed", type: "select", required: true, options: [
        { value: "residential_reroof", label: "Residential re-roof" },
        { value: "commercial_reroof", label: "Commercial re-roof" },
        { value: "repair", label: "Roof repair" },
        { value: "inspection", label: "Roof inspection" },
        { value: "new_construction", label: "New construction" },
      ]},
      { key: "roof_size_sqft", label: "Approximate roof size (sq ft)", type: "number", placeholder: "2500", required: true },
      { key: "timeline", label: "When do you need this done?", type: "select", required: true, options: [
        { value: "asap", label: "ASAP — emergency / active leak" },
        { value: "this_month", label: "Within this month" },
        { value: "next_3_months", label: "Next 1-3 months" },
        { value: "just_exploring", label: "Just getting quotes" },
      ]},
      { key: "current_situation", label: "Describe the issue", type: "textarea", placeholder: "e.g., Roof is 20 years old, noticing leaks in the attic after heavy rain...", required: true },
    ],
  },

  window_cleaning: {
    id: "window_cleaning",
    niche: "Window Cleaning",
    name: "Window Cleaning Appointment Setter",
    description: "Qualifies window cleaning requests and estimates pricing.",
    systemPrompt: `You are a window cleaning appointment qualification AI. You analyse requests for window cleaning companies and determine appointment priority, pricing estimates, and scheduling.

## How to Score
- Property type: commercial (higher value) vs residential
- Window count: more windows = higher job value
- Access difficulty: ground-level easy; multi-story or hard-to-reach = premium
- Frequency: recurring (weekly/monthly) = highest lifetime value
- Budget alignment: willing to pay = HIGH priority

## Pricing Guidelines
- Residential: £3-8 per window, typical home 15-30 windows = £80-200
- Commercial: £150-500+ per clean depending on size
- Recurring discount: 10-15% for monthly service

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "Jane Smith", required: true },
      { key: "property_type", label: "Property type", type: "select", required: true, options: [
        { value: "residential_house", label: "Residential — house" },
        { value: "residential_flat", label: "Residential — flat/apartment" },
        { value: "commercial_small", label: "Commercial — small office/shop" },
        { value: "commercial_large", label: "Commercial — large building" },
      ]},
      { key: "window_count", label: "Approximate number of windows", type: "number", placeholder: "20", required: true },
      { key: "access_difficulty", label: "Access difficulty", type: "select", required: true, options: [
        { value: "ground_level", label: "Ground level — easy access" },
        { value: "first_floor", label: "First floor — ladder needed" },
        { value: "multi_story", label: "Multi-story — specialist equipment" },
        { value: "mixed", label: "Mix of heights" },
      ]},
      { key: "frequency", label: "How often do you need cleaning?", type: "select", required: true, options: [
        { value: "one_off", label: "One-off clean" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Every 3 months" },
        { value: "biannual", label: "Twice a year" },
      ]},
      { key: "budget_range", label: "Budget range", type: "select", required: false, options: [
        { value: "under_100", label: "Under £100" },
        { value: "100_200", label: "£100-200" },
        { value: "200_500", label: "£200-500" },
        { value: "500_plus", label: "£500+" },
      ]},
      { key: "notes", label: "Anything else we should know?", type: "textarea", placeholder: "e.g., conservatory, skylights, hard-to-reach areas...", required: false },
    ],
  },

  hvac: {
    id: "hvac",
    niche: "HVAC",
    name: "HVAC Service Qualifier",
    description: "Assesses HVAC service urgency and estimates repair vs replacement.",
    systemPrompt: `You are an HVAC service qualification AI. You analyse service requests for HVAC companies and determine urgency, cost estimates, and whether repair or replacement is likely needed.

## How to Score
- System age: >15 years = likely replacement ($5,000-$15,000); <10 years = likely repair ($200-$2,000)
- Issue type: no heat/AC in extreme weather = emergency; strange noises = moderate; routine maintenance = low
- Property size: larger properties = bigger systems = higher value
- Urgency: emergency calls = premium pricing opportunity

## Priority Rules
- HIGH: Emergency (no heat in winter / no AC in summer), system failure, safety concern
- MEDIUM: Reduced efficiency, intermittent issues, system 10-15 years old
- LOW: Routine maintenance, minor noise, just exploring options

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "John Smith", required: true },
      { key: "system_age", label: "How old is your HVAC system?", type: "select", required: true, options: [
        { value: "under_5", label: "Less than 5 years" },
        { value: "5_10", label: "5-10 years" },
        { value: "10_15", label: "10-15 years" },
        { value: "over_15", label: "Over 15 years" },
        { value: "unknown", label: "Not sure" },
      ]},
      { key: "issue_type", label: "What's the issue?", type: "select", required: true, options: [
        { value: "no_heat", label: "No heat" },
        { value: "no_cooling", label: "No cooling / AC not working" },
        { value: "strange_noises", label: "Strange noises" },
        { value: "poor_airflow", label: "Poor airflow or uneven temperature" },
        { value: "high_bills", label: "Unusually high energy bills" },
        { value: "maintenance", label: "Routine maintenance / tune-up" },
        { value: "new_install", label: "New system installation" },
      ]},
      { key: "urgency", label: "How urgent is this?", type: "select", required: true, options: [
        { value: "emergency", label: "Emergency — need help today" },
        { value: "this_week", label: "This week" },
        { value: "this_month", label: "Sometime this month" },
        { value: "planning", label: "Just planning ahead" },
      ]},
      { key: "property_size_sqft", label: "Property size (sq ft)", type: "number", placeholder: "1800", required: true },
      { key: "location", label: "Location", type: "text", placeholder: "e.g., Dallas, TX", required: true },
      { key: "details", label: "Describe the problem", type: "textarea", placeholder: "e.g., Furnace making clicking sound, heat comes on intermittently...", required: false },
    ],
  },

  landscaping: {
    id: "landscaping",
    niche: "Landscaping",
    name: "Landscaping Quote Generator",
    description: "Calculates landscaping service costs and generates quotes.",
    systemPrompt: `You are a landscaping quote generation AI. You analyse service requests for landscaping companies and generate accurate pricing estimates.

## Pricing Guidelines
- Lawn mowing: $30-80/visit for residential, $100-500+ for commercial
- Full maintenance (mow + edge + blow): $50-150/visit residential
- Landscape design: $500-5,000+ depending on scope
- Monthly contracts: $150-500/month residential, $500-2,000+ commercial
- Seasonal cleanup: $200-600

## How to Score
- Recurring service = highest lifetime value (HIGH priority)
- Large property + full service = HIGH
- One-off jobs = MEDIUM unless large scope
- "Just a quote" with no timeline = LOW

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "Jane Smith", required: true },
      { key: "yard_size_sqft", label: "Yard size (sq ft)", type: "number", placeholder: "5000", required: true },
      { key: "service_type", label: "What do you need?", type: "select", required: true, options: [
        { value: "mowing", label: "Lawn mowing" },
        { value: "full_maintenance", label: "Full maintenance (mow, edge, trim)" },
        { value: "landscape_design", label: "Landscape design / installation" },
        { value: "cleanup", label: "Seasonal cleanup" },
        { value: "tree_shrub", label: "Tree & shrub care" },
        { value: "irrigation", label: "Irrigation / sprinkler" },
      ]},
      { key: "frequency", label: "How often?", type: "select", required: true, options: [
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Every 2 weeks" },
        { value: "monthly", label: "Monthly" },
        { value: "one_off", label: "One-time service" },
      ]},
      { key: "property_type", label: "Property type", type: "select", required: true, options: [
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "hoa", label: "HOA / Community" },
      ]},
      { key: "location", label: "Location", type: "text", placeholder: "e.g., Austin, TX", required: true },
      { key: "notes", label: "Additional details", type: "textarea", placeholder: "e.g., Backyard has a slope, need hedge trimming too...", required: false },
    ],
  },

  plumbing: {
    id: "plumbing",
    niche: "Plumbing",
    name: "Plumbing Emergency Prioritizer",
    description: "Determines plumbing issue urgency and dispatches priority.",
    systemPrompt: `You are a plumbing emergency prioritization AI. You analyse incoming requests for plumbing companies and determine urgency, estimated costs, and dispatch priority.

## Priority Rules
- EMERGENCY (HIGH 80-100): Active leak/flood, no water, sewage backup, gas smell
- URGENT (MEDIUM 50-79): Slow drain, running toilet, minor leak (contained), water heater issues
- ROUTINE (LOW 0-49): Fixture upgrade, routine maintenance, cosmetic issues

## Cost Guidelines
- Emergency call-out: $150-300 (after hours: $250-500)
- Drain cleaning: $100-300
- Leak repair: $150-500
- Water heater repair: $200-800; replacement: $1,000-3,000
- Pipe replacement: $500-5,000+
- Toilet/faucet install: $150-400

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "John Smith", required: true },
      { key: "issue_type", label: "What's the issue?", type: "select", required: true, options: [
        { value: "leak_active", label: "Active leak / flooding" },
        { value: "no_water", label: "No water" },
        { value: "sewage_backup", label: "Sewage backup" },
        { value: "slow_drain", label: "Slow or clogged drain" },
        { value: "running_toilet", label: "Running toilet" },
        { value: "water_heater", label: "Water heater problem" },
        { value: "pipe_issue", label: "Pipe repair/replacement" },
        { value: "fixture_install", label: "New fixture installation" },
      ]},
      { key: "severity", label: "How severe?", type: "select", required: true, options: [
        { value: "emergency", label: "Emergency — water everywhere / no water" },
        { value: "urgent", label: "Urgent — getting worse" },
        { value: "moderate", label: "Moderate — annoying but manageable" },
        { value: "low", label: "Low — just need it fixed when convenient" },
      ]},
      { key: "is_after_hours", label: "Is this outside business hours?", type: "select", required: true, options: [
        { value: "yes", label: "Yes — evening/weekend/holiday" },
        { value: "no", label: "No — regular business hours" },
      ]},
      { key: "property_type", label: "Property type", type: "select", required: true, options: [
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
      ]},
      { key: "location", label: "Location", type: "text", placeholder: "e.g., Phoenix, AZ", required: true },
      { key: "details", label: "Describe the issue", type: "textarea", placeholder: "e.g., Kitchen sink leaking under the cabinet, water pooling on floor...", required: true },
    ],
  },

  pest_control: {
    id: "pest_control",
    niche: "Pest Control",
    name: "Pest Control Service Qualifier",
    description: "Qualifies pest control requests and estimates treatment needs.",
    systemPrompt: `You are a pest control service qualification AI. You analyse requests for pest control companies and determine treatment priority, cost estimates, and scheduling.

## Priority Rules
- HIGH: Termites (structural damage risk), bed bugs, large rodent infestation, health hazard pests
- MEDIUM: Ants, cockroaches, wasps/bees, moderate infestation
- LOW: Preventive treatment, minor ant issue, spider control

## Cost Guidelines
- Initial treatment: $150-400 residential, $300-1,000+ commercial
- Monthly prevention plan: $40-70/month residential
- Termite treatment: $500-2,500+
- Bed bug treatment: $300-1,500 per room
- Rodent removal: $200-600

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "Jane Smith", required: true },
      { key: "pest_type", label: "What type of pest?", type: "select", required: true, options: [
        { value: "ants", label: "Ants" },
        { value: "cockroaches", label: "Cockroaches" },
        { value: "termites", label: "Termites" },
        { value: "rodents", label: "Mice / Rats" },
        { value: "bed_bugs", label: "Bed bugs" },
        { value: "wasps_bees", label: "Wasps / Bees" },
        { value: "spiders", label: "Spiders" },
        { value: "other", label: "Other / not sure" },
      ]},
      { key: "infestation_level", label: "How bad is it?", type: "select", required: true, options: [
        { value: "just_spotted", label: "Just spotted one or two" },
        { value: "moderate", label: "Seeing them regularly" },
        { value: "severe", label: "Major infestation" },
        { value: "preventive", label: "No issue — want preventive treatment" },
      ]},
      { key: "property_size_sqft", label: "Property size (sq ft)", type: "number", placeholder: "2000", required: true },
      { key: "property_type", label: "Property type", type: "select", required: true, options: [
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "rental", label: "Rental property" },
      ]},
      { key: "location", label: "Location", type: "text", placeholder: "e.g., Miami, FL", required: true },
      { key: "notes", label: "Additional details", type: "textarea", placeholder: "e.g., Seeing ants in the kitchen near the sink area...", required: false },
    ],
  },

  dental: {
    id: "dental",
    niche: "Dental",
    name: "Dental Appointment Qualifier",
    description: "Qualifies dental appointment requests and checks insurance fit.",
    systemPrompt: `You are a dental appointment qualification AI. You analyse incoming appointment requests for dental practices and determine scheduling priority, insurance compatibility, and patient value.

## Priority Rules
- HIGH: Emergency (pain, swelling, broken tooth), cosmetic procedure (high-value), insured patient
- MEDIUM: Routine checkup with insurance, minor concern, new patient
- LOW: Price-shopping, no insurance + no urgency, just browsing

## Value Guidelines
- New patient exam + cleaning: $150-300 (insurance covers 80-100%)
- Cosmetic (veneers, whitening): $500-3,000+
- Emergency visit: $200-500
- Crown/bridge: $800-3,000
- Implant: $3,000-6,000

## Insurance Impact
- Insured patients = higher conversion rate, predictable revenue
- Uninsured = higher ticket but lower conversion

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "John Smith", required: true },
      { key: "has_insurance", label: "Do you have dental insurance?", type: "select", required: true, options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not_sure", label: "Not sure" },
      ]},
      { key: "urgency", label: "How urgent is your need?", type: "select", required: true, options: [
        { value: "emergency", label: "Emergency — pain, swelling, or broken tooth" },
        { value: "soon", label: "Need to be seen soon (within a week)" },
        { value: "routine", label: "Routine checkup / cleaning" },
        { value: "cosmetic", label: "Cosmetic procedure (whitening, veneers)" },
      ]},
      { key: "treatment_type", label: "What do you need?", type: "select", required: true, options: [
        { value: "checkup_cleaning", label: "Checkup & cleaning" },
        { value: "filling", label: "Filling or cavity treatment" },
        { value: "crown_bridge", label: "Crown or bridge" },
        { value: "implant", label: "Dental implant" },
        { value: "whitening", label: "Teeth whitening" },
        { value: "veneers", label: "Veneers" },
        { value: "extraction", label: "Tooth extraction" },
        { value: "other", label: "Other / not sure" },
      ]},
      { key: "patient_type", label: "Are you a new or existing patient?", type: "select", required: true, options: [
        { value: "new", label: "New patient" },
        { value: "existing", label: "Existing patient" },
      ]},
      { key: "phone", label: "Phone number", type: "text", placeholder: "(555) 123-4567", required: false },
      { key: "notes", label: "Anything else we should know?", type: "textarea", placeholder: "e.g., Anxious about dental visits, prefer morning appointments...", required: false },
    ],
  },

  real_estate: {
    id: "real_estate",
    niche: "Real Estate",
    name: "Real Estate Showing Scheduler",
    description: "Qualifies property buyers and schedules viewings.",
    systemPrompt: `You are a real estate buyer qualification AI. You analyse incoming enquiries for real estate agents and determine buyer readiness, property fit, and showing priority.

## Priority Rules
- HIGH (80-100): Pre-approved, ready to buy within 30 days, budget aligns with market
- MEDIUM (50-79): Interested but 1-3 months out, or not yet pre-approved
- LOW (0-49): Just browsing, 6+ months out, unrealistic budget for area

## Buyer Score Factors
- Pre-approval status (biggest factor)
- Timeline (shorter = higher priority)
- Budget-to-market alignment
- Specificity of preferences (more specific = more serious)

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "Jane Smith", required: true },
      { key: "budget_range", label: "Budget range", type: "select", required: true, options: [
        { value: "under_200k", label: "Under $200,000" },
        { value: "200k_400k", label: "$200,000 - $400,000" },
        { value: "400k_700k", label: "$400,000 - $700,000" },
        { value: "700k_1m", label: "$700,000 - $1,000,000" },
        { value: "over_1m", label: "Over $1,000,000" },
      ]},
      { key: "preferred_location", label: "Preferred area", type: "text", placeholder: "e.g., North Austin, near good schools", required: true },
      { key: "timeline", label: "When are you looking to buy?", type: "select", required: true, options: [
        { value: "asap", label: "Within 30 days" },
        { value: "1_3_months", label: "1-3 months" },
        { value: "3_6_months", label: "3-6 months" },
        { value: "just_browsing", label: "Just browsing / exploring" },
      ]},
      { key: "buyer_type", label: "Buyer type", type: "select", required: true, options: [
        { value: "first_time", label: "First-time buyer" },
        { value: "move_up", label: "Moving up / upgrading" },
        { value: "downsizing", label: "Downsizing" },
        { value: "investor", label: "Investor" },
        { value: "relocating", label: "Relocating" },
      ]},
      { key: "property_preferences", label: "What are you looking for?", type: "textarea", placeholder: "e.g., 3+ bedrooms, garage, quiet neighborhood, good schools nearby...", required: false },
      { key: "pre_approved", label: "Are you pre-approved for a mortgage?", type: "select", required: true, options: [
        { value: "yes", label: "Yes — pre-approved" },
        { value: "in_progress", label: "In progress" },
        { value: "no", label: "Not yet" },
        { value: "cash", label: "Cash buyer" },
      ]},
    ],
  },

  auto_repair: {
    id: "auto_repair",
    niche: "Auto Repair",
    name: "Auto Repair Quote Estimator",
    description: "Estimates auto repair costs and schedules service.",
    systemPrompt: `You are an auto repair quote estimation AI. You analyse vehicle repair requests for auto repair shops and provide cost estimates, timelines, and service priority.

## Cost Guidelines
- Oil change: $30-75 (synthetic: $65-125)
- Brake pads: $150-350 per axle
- Battery replacement: $100-250
- Tire rotation/balance: $50-100
- Engine diagnostics: $80-150
- Transmission repair: $1,500-4,000
- Major engine work: $2,000-7,000+
- AC repair: $200-1,000

## Priority Rules
- HIGH: Safety issue (brakes, steering, tires), warning lights, vehicle not running
- MEDIUM: Performance issue, scheduled maintenance overdue, minor concern
- LOW: Routine maintenance, cosmetic, just getting a quote

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "John Smith", required: true },
      { key: "vehicle_year", label: "Vehicle year", type: "number", placeholder: "2020", required: true },
      { key: "vehicle_make_model", label: "Make and model", type: "text", placeholder: "e.g., Toyota Camry", required: true },
      { key: "mileage", label: "Current mileage", type: "number", placeholder: "55000", required: true },
      { key: "issue_description", label: "What's the issue?", type: "select", required: true, options: [
        { value: "brakes", label: "Brakes — squeaking, grinding, or soft pedal" },
        { value: "engine", label: "Engine — rough running, stalling, power loss" },
        { value: "transmission", label: "Transmission — slipping, hard shifts" },
        { value: "electrical", label: "Electrical — battery, lights, warning lights" },
        { value: "ac_heating", label: "AC or heating not working" },
        { value: "oil_change", label: "Oil change / routine service" },
        { value: "tires", label: "Tires — flat, worn, alignment" },
        { value: "other", label: "Other" },
      ]},
      { key: "details", label: "Describe the problem", type: "textarea", placeholder: "e.g., Brakes squeaking when stopping, gets louder in the morning...", required: true },
      { key: "location", label: "Your location", type: "text", placeholder: "e.g., Houston, TX", required: false },
    ],
  },

  pool_service: {
    id: "pool_service",
    niche: "Pool Service",
    name: "Pool Service Route Planner",
    description: "Qualifies pool service requests and plans optimal routing.",
    systemPrompt: `You are a pool service qualification AI. You analyse service requests for pool companies and determine service needs, pricing, and route efficiency.

## Pricing Guidelines
- Weekly maintenance: $100-200/month residential, $200-500+ commercial
- One-time cleaning: $150-300
- Opening/closing (seasonal): $200-400 each
- Equipment repair: $200-1,500
- Replastering/renovation: $5,000-15,000+

## Priority Rules
- HIGH: Recurring weekly service (highest lifetime value), pool equipment failure
- MEDIUM: Seasonal open/close, one-time deep clean, equipment issue
- LOW: Just getting a quote, off-season inquiry

## Route Efficiency
- Multiple pools in same area = higher efficiency = can offer better pricing
- Remote locations = travel cost consideration

${DEMO_OUTPUT_SCHEMA}`,
    formFields: [
      { key: "name", label: "Your name", type: "text", placeholder: "Jane Smith", required: true },
      { key: "pool_size", label: "Pool size", type: "select", required: true, options: [
        { value: "small", label: "Small (under 10,000 gallons)" },
        { value: "medium", label: "Medium (10,000-20,000 gallons)" },
        { value: "large", label: "Large (20,000-40,000 gallons)" },
        { value: "commercial", label: "Commercial / very large" },
      ]},
      { key: "condition", label: "Current pool condition", type: "select", required: true, options: [
        { value: "well_maintained", label: "Well maintained — just need regular service" },
        { value: "needs_attention", label: "Needs some attention — been a while" },
        { value: "neglected", label: "Neglected — green water, debris" },
        { value: "new_pool", label: "Newly built / recently renovated" },
      ]},
      { key: "service_frequency", label: "What service do you need?", type: "select", required: true, options: [
        { value: "weekly", label: "Weekly maintenance" },
        { value: "biweekly", label: "Every 2 weeks" },
        { value: "one_time", label: "One-time cleaning" },
        { value: "seasonal", label: "Seasonal open/close" },
        { value: "repair", label: "Equipment repair" },
      ]},
      { key: "property_type", label: "Property type", type: "select", required: true, options: [
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "hoa", label: "HOA / Community" },
      ]},
      { key: "location", label: "Location", type: "text", placeholder: "e.g., Scottsdale, AZ", required: true },
      { key: "notes", label: "Anything else?", type: "textarea", placeholder: "e.g., Hot tub also needs service, pool heater not working...", required: false },
    ],
  },
};

/**
 * Look up an agent config by its slug.
 */
export function getAgentForNiche(nicheSlug: string): AgentConfig | null {
  return NICHE_AGENTS[nicheSlug] ?? null;
}

/**
 * Map a human-readable niche name (from AI recommendations) to an agent slug.
 * Uses fuzzy matching — normalises to lowercase and checks for keyword containment.
 */
export function findAgentSlug(nicheName: string): string | null {
  const lower = nicheName.toLowerCase();

  const KEYWORD_MAP: Record<string, string[]> = {
    roofing: ["roof", "roofing"],
    window_cleaning: ["window", "glass cleaning"],
    hvac: ["hvac", "heating", "air conditioning", "furnace"],
    landscaping: ["landscap", "lawn", "garden", "yard"],
    plumbing: ["plumb", "pipe", "drain", "leak"],
    pest_control: ["pest", "exterminator", "termite", "rodent", "bug"],
    dental: ["dental", "dentist", "teeth", "oral"],
    real_estate: ["real estate", "property", "realtor", "housing"],
    auto_repair: ["auto repair", "car repair", "mechanic", "vehicle"],
    pool_service: ["pool", "swimming"],
  };

  for (const [slug, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return slug;
    }
  }

  return null;
}
