import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://www.ecfr.gov';

export interface Agency {
    name: string;
    short_name: string;
    display_name: string;
    sortable_name: string;
    slug: string;
    children: Agency[];
    cfr_references: CfrReference[];
}

export interface CfrReference {
    title: number;
    chapter: string;
    subtitle?: string;
}

export interface Title {
    number: number;
    name: string;
    latest_amended_on: string;
    latest_issue_date: string;
    up_to_date_as_of: string;
    reserved: boolean;
}

export interface TitleVersion {
    date: string;
    amendment_date: string;
    issue_date: string;
    identifier: string;
    name: string;
    part: string;
    substantive: boolean;
    removed: boolean;
}

export interface StructureNode {
    identifier: string;
    label: string;
    label_level: string;
    label_description: string;
    reserved: boolean;
    type: string;
    children?: StructureNode[];
    descendant_range?: string;
    size?: number;
}

class EcfrClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'eCFR-Analyzer/1.0 (Educational/Research Purpose)'
            },
            timeout: 60000
        });
    }

    async getAgencies(): Promise<{ agencies: Agency[] }> {
        const response = await this.client.get('/api/admin/v1/agencies.json');
        return response.data;
    }

    async getTitles(): Promise<{ titles: Title[] }> {
        const response = await this.client.get('/api/versioner/v1/titles.json');
        return response.data;
    }

    async getTitleVersions(titleNumber: number): Promise<{ content_versions: TitleVersion[] }> {
        const response = await this.client.get(`/api/versioner/v1/versions/title-${titleNumber}.json`);
        return response.data;
    }

    async getTitleStructure(date: string, titleNumber: number): Promise<StructureNode> {
        const response = await this.client.get(`/api/versioner/v1/structure/${date}/title-${titleNumber}.json`);
        return response.data;
    }

    async getTitleXml(date: string, titleNumber: number): Promise<string> {
        const response = await this.client.get(`/api/versioner/v1/full/${date}/title-${titleNumber}.xml`, {
            headers: { 'Accept': 'application/xml' },
            responseType: 'text'
        });
        return response.data;
    }

    async searchTitle(titleNumber: number, query: string): Promise<any> {
        const response = await this.client.get('/api/search/v1/results', {
            params: {
                query,
                per_page: 100,
                page: 1,
                'cfr_title': titleNumber
            }
        });
        return response.data;
    }
}

export const ecfrClient = new EcfrClient();
