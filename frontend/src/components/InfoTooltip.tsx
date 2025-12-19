import { useState } from 'react';

interface TooltipProps {
    title: string;
    calculation: string;
    helpfulness: string;
}

export function InfoTooltip({ title, calculation, helpfulness }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span
            className="info-tooltip"
            style={{ position: 'relative', display: 'inline-flex', marginLeft: '8px' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'help'
            }}>
                ?
            </span>
            {isVisible && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    width: '320px',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        {title}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <strong>How it's measured:</strong> {calculation}
                    </div>
                    <div style={{ color: 'var(--accent-primary)' }}>
                        <strong>Policy insight:</strong> {helpfulness}
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid var(--bg-secondary)'
                    }} />
                </div>
            )}
        </span>
    );
}

// Metric definitions organized by category with improved descriptions
export const METRIC_DEFINITIONS = {
    // === OVERALL SCORES ===
    burdenIndex: {
        title: 'Regulatory Burden Index',
        calculation: 'Composite score (0-100) combining: regulatory volume (word count), prescriptive language (mandates), paperwork requirements, and enforcement intensity.',
        helpfulness: 'The single most important prioritization metric. Agencies with scores above 50 should be top candidates for comprehensive review. Use this to rank agencies for deregulation focus.'
    },
    complexityScore: {
        title: 'Regulatory Complexity Score',
        calculation: 'Scale of 0-10 based on: total word volume (25%), section density (25%), structural hierarchy depth (25%), and amendment frequency (25%).',
        helpfulness: 'Indicates how difficult it is for businesses to understand and comply. High scores (>6) suggest regulations may benefit from plain-language rewriting or structural simplification.'
    },

    // === PRESCRIPTIVE BURDEN ===
    mandateDensity: {
        title: 'Mandate Density',
        calculation: 'Counts prescriptive terms ("shall", "must", "required", "mandatory", "obligated") per 1,000 words of regulatory text.',
        helpfulness: 'Measures how command-heavy the regulations are. High density means businesses face more specific obligations per page. Consider replacing rigid mandates with outcome-based standards.'
    },
    prohibitionDensity: {
        title: 'Prohibition Density',
        calculation: 'Counts restrictive language ("shall not", "may not", "prohibited", "forbidden", "unlawful", "illegal") per 1,000 words.',
        helpfulness: 'Shows how many activities are explicitly banned. High prohibition density may stifle innovation or create compliance traps. Review whether prohibitions are still necessary.'
    },
    penaltyScore: {
        title: 'Penalty & Enforcement Score',
        calculation: 'Counts enforcement terms ("penalty", "fine", "violation", "sanction", "imprisonment") normalized to a 0-10 scale based on regulatory volume.',
        helpfulness: 'Indicates how punitive the regulatory framework is. High scores suggest an enforcement-heavy approach. Consider whether education/assistance could replace penalties.'
    },

    // === ADMINISTRATIVE BURDEN ===
    formReportingBurden: {
        title: 'Paperwork & Reporting Burden',
        calculation: 'Total count of reporting-related terms: "report", "form", "submit", "filing", "disclosure", "notify", "recordkeeping".',
        helpfulness: 'Paperwork is a direct cost to businesses. High counts indicate significant administrative overhead. Prime target for digitization, automation, or elimination of duplicative requirements.'
    },
    permissionBurden: {
        title: 'Licensing & Permit Requirements',
        calculation: 'Counts permission-related terms: "permit", "license", "approval", "authorization", "certificate", "accreditation".',
        helpfulness: 'Each permit is a barrier to entry for new businesses. High counts may indicate occupational licensing or approval processes that could be streamlined or eliminated.'
    },
    inspectionBurden: {
        title: 'Inspection & Audit Requirements',
        calculation: 'Counts oversight terms: "inspection", "audit", "examination", "review", "monitoring", "oversight".',
        helpfulness: 'Ongoing inspections create continuous compliance costs. High counts suggest agencies may be over-monitoring. Consider risk-based inspection schedules instead of blanket requirements.'
    },
    deadlineCount: {
        title: 'Deadline & Timing Pressure',
        calculation: 'Counts time-bound language: "within X days", "no later than", "deadline", "promptly", "immediately", "forthwith", "time limit".',
        helpfulness: 'Multiple deadlines create scheduling complexity and rush costs. High counts may indicate opportunities to consolidate reporting periods or extend compliance windows.'
    },

    // === COMPLEXITY INDICATORS ===
    definitionDensity: {
        title: 'Technical Definition Density',
        calculation: 'Counts definition patterns ("means", "defined as", "the term", "definition of") per 1,000 words.',
        helpfulness: 'Heavy use of defined terms creates a specialized vocabulary barrier. High density suggests regulations may be inaccessible to small businesses without legal expertise.'
    },
    exemptionCount: {
        title: 'Exemption & Exception Count',
        calculation: 'Total count of exception language: "except", "exception", "exemption", "waiver", "exclusion", "unless", "notwithstanding".',
        helpfulness: 'Many exemptions indicate a complex patchwork of rules with special cases. Could signal opportunities for simplification through broader categorical rules.'
    },
    structureDepth: {
        title: 'Regulatory Structure Depth',
        calculation: 'Maximum nesting level in CFR hierarchy (Title → Subtitle → Chapter → Subchapter → Part → Subpart → Section → Subsection).',
        helpfulness: 'Deep nesting makes it harder to find applicable rules. Regulations with depth >5 may benefit from reorganization into flatter, more navigable structures.'
    },
    crossReferenceCount: {
        title: 'Cross-Reference Complexity',
        calculation: 'Counts internal references to other CFR sections: "§ X.X", "part X", "subpart", "paragraph (x)", "CFR X".',
        helpfulness: 'High cross-referencing creates a web of interdependencies. Makes it difficult to understand requirements in isolation and risky to modify regulations without unintended effects.'
    },

    // === BUSINESS IMPACT ===
    complianceCostMentions: {
        title: 'Compliance Cost Language',
        calculation: 'Counts cost-related terms: "cost", "fee", "expense", "payment", "charge", "price".',
        helpfulness: 'Indicates potential direct financial burden on regulated parties. High counts suggest regulations may impose significant monetary costs worth analyzing for reduction opportunities.'
    },
    discretionaryLanguage: {
        title: 'Regulatory Flexibility Index',
        calculation: 'Counts flexible language: "may", "discretion", "reasonable", "appropriate", "as determined", "as deemed".',
        helpfulness: 'INVERSE METRIC: Higher is better! Flexibility language allows compliance adaptation. Low counts suggest rigid, one-size-fits-all requirements that may not fit all business contexts.'
    },
    smallBusinessMentions: {
        title: 'Small Business Consideration',
        calculation: 'Counts SMB-specific terms: "small business", "small entity", "small organization", "SME".',
        helpfulness: 'Shows whether regulations acknowledge differential impact on small businesses. Low or zero counts may indicate need for small business exemptions or tiered requirements.'
    }
};

// Category groupings for organized display
export const METRIC_CATEGORIES = {
    overall: {
        title: '📊 Overall Burden Scores',
        description: 'Top-level indicators for prioritizing agencies',
        metrics: ['burdenIndex', 'complexityScore']
    },
    prescriptive: {
        title: '⚖️ Prescriptive Burden',
        description: 'How command-heavy and restrictive the regulations are',
        metrics: ['mandateDensity', 'prohibitionDensity', 'penaltyScore']
    },
    administrative: {
        title: '📝 Administrative Burden',
        description: 'Paperwork, permits, inspections, and deadlines',
        metrics: ['formReportingBurden', 'permissionBurden', 'inspectionBurden', 'deadlineCount']
    },
    complexity: {
        title: '🔗 Complexity Indicators',
        description: 'Structural and language complexity factors',
        metrics: ['definitionDensity', 'exemptionCount', 'structureDepth', 'crossReferenceCount']
    },
    business: {
        title: '💼 Business Impact',
        description: 'Direct effects on regulated businesses',
        metrics: ['complianceCostMentions', 'discretionaryLanguage', 'smallBusinessMentions']
    }
};
