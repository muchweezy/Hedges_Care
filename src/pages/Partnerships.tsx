import React, { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Globe,
  HandHeart,
  Award,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Download,
  FileText,
  Target,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { fabricGateway } from '@/fabric';
import PartnershipCard from '@/components/fabric/PartnershipCard';
import PartnershipDashboard from '@/components/fabric/PartnershipDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Partnership } from '@/fabric';

interface Partner {
  id: string;
  name: string;
  type: 'ngo' | 'government' | 'university' | 'corporation';
  logo: string;
  description: string;
  impact: string;
  website: string;
  location: string;
  programs: string[];
}

interface DeploymentMetrics {
  totalFarmers: number;
  regionsServed: number;
  plantsAnalyzed: number;
  carbonSequestration: number; // tons of CO2 captured
}

const Partnerships = () => {
  const [userOrgId, setUserOrgId] = useState<string>('Org1MSP');
  const [blockchainPartnerships, setBlockchainPartnerships] = useState<Partnership[]>([]);
  const [selectedPartnership, setSelectedPartnership] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    organization: '',
    email: '',
    phone: '',
    type: '',
    message: ''
  });
  
  const [metrics] = useState<DeploymentMetrics>({
    totalFarmers: 15420,
    regionsServed: 23,
    plantsAnalyzed: 89340,
    carbonSequestration: 2847.5 // tons of CO2 captured
  });

  const { t } = useLanguage();
  const { toast } = useToast();

  // Load blockchain partnerships
  useEffect(() => {
    loadBlockchainPartnerships();
  }, [userOrgId]);

  const loadBlockchainPartnerships = async () => {
    try {
      setLoading(true);
      await fabricGateway.initialize();
      const partnershipService = fabricGateway.getPartnershipService();
      const partnerships = await partnershipService.getActivePartnerships(userOrgId);
      setBlockchainPartnerships(partnerships);
    } catch (error) {
      console.error('Failed to load blockchain partnerships:', error);
      toast({
        title: 'Warning',
        description: 'Unable to load blockchain partnerships. Make sure Fabric network is running.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const partnershipService = fabricGateway.getPartnershipService();
      await partnershipService.createPartnership({
        org1Id: userOrgId,
        org2Id: createForm.partnerOrgId,
        org1Name: 'Hedges Care',
        org2Name: createForm.partnerOrgName,
        agreementHash: await calculateHash(createForm.agreementFile),
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        partnershipType: createForm.partnershipType
      });

      toast({
        title: 'Success',
        description: 'Partnership created on blockchain'
      });

      setShowCreateDialog(false);
      setCreateForm({
        partnerOrgId: '',
        partnerOrgName: '',
        agreementFile: null as any,
        startDate: '',
        endDate: '',
        partnershipType: 'landscaping'
      });

      loadBlockchainPartnerships();
    } catch (error) {
      console.error('Failed to create partnership:', error);
      toast({
        title: 'Error',
        description: 'Failed to create partnership on blockchain',
        variant: 'destructive'
      });
    }
  };

  const calculateHash = async (file: File | null): Promise<string> => {
    if (!file) return '';
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const [createForm, setCreateForm] = useState({
    partnerOrgId: '',
    partnerOrgName: '',
    agreementFile: null as File | null,
    startDate: '',
    endDate: '',
    partnershipType: 'landscaping' as const
  });

  const partners: Partner[] = [
    {
      id: 'unep',
      name: 'United Nations Environment Programme',
      type: 'ngo',
      logo: '🌍',
      description: 'Leading global environmental authority that sets the global environmental agenda',
      impact: '150+ countries, 2.5M+ hectares reforested',
      website: 'https://www.unep.org',
      location: 'Global',
      programs: ['Billion Tree Campaign', 'Carbon Sequestration Initiative', 'Green Economy']
    },
    {
      id: 'world-resources-institute',
      name: 'World Resources Institute (WRI)',
      type: 'ngo',
      logo: '🌱',
      description: 'Global research organization that works on sustainable resource use',
      impact: '100M+ hectares of land under sustainable management',
      website: 'https://www.wri.org',
      location: 'United States (Global reach)',
      programs: ['Global Forest Watch', 'Food and Land Use', 'Carbon Program']
    },
    {
      id: 'african-green-wall',
      name: 'African Union Great Green Wall Initiative',
      type: 'government',
      logo: '🌳',
      description: 'Ambitious project to grow an 8,000 km natural wonder across Africa',
      impact: '100M+ hectares to be restored, 10M+ jobs created',
      website: 'https://www.greatgreenwall.org',
      location: 'Africa',
      programs: ['Land Restoration', 'Climate Resilience', 'Livelihood Creation']
    },
    {
      id: 'plant-for-the-planet',
      name: 'Plant-for-the-Planet',
      type: 'ngo',
      logo: '🌳',
      description: 'Youth-led movement focused on planting trees worldwide',
      impact: '15B+ trees planted, 200+ countries involved',
      website: 'https://www.plant-for-the-planet.org',
      location: 'Global',
      programs: ['Trillion Campaign', 'Youth Network', 'Ecosystem Restoration']
    },
    {
      id: 'we-forest',
      name: 'WeForest',
      type: 'ngo',
      logo: '🌿',
      description: 'Non-profit dedicated to sustainable forest restoration and conservation',
      impact: '450M+ trees planted, 500K+ hectares restored',
      website: 'https://www.weforest.org',
      location: 'Global',
      programs: ['Corporate Reforestation', 'Women in Forestry', 'Biodiversity Protection']
    },
    {
      id: 'kenya-forestry-service',
      name: 'Kenya Forest Service',
      type: 'government',
      logo: '🇰🇪',
      description: 'Government body responsible for forest conservation and management in Kenya',
      impact: '7.6% forest cover target, 50K+ hectares reforested annually',
      website: 'https://www.kenyaforestservice.org',
      location: 'Kenya',
      programs: ['National Forest Policy', 'Community Forest Associations', 'Urban Forestry']
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Partnership Inquiry Sent',
      description: 'We will review your proposal and get back to you within 48 hours.',
    });
    
    setContactForm({
      organization: '',
      email: '',
      phone: '',
      type: '',
      message: ''
    });
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'ngo': return 'bg-green-500';
      case 'government': return 'bg-blue-500';
      case 'university': return 'bg-purple-500';
      case 'corporation': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case 'ngo': return 'NGO';
      case 'government': return 'Government';
      case 'university': return 'University';
      case 'corporation': return 'Corporation';
      default: return 'Partner';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌱 Plant Carbon Partnerships
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Collaborating with organizations to scale carbon sequestration through high-efficiency plant cultivation and reforestation
          </p>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="text-center py-6">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalFarmers.toLocaleString()}+
              </div>
              <div className="text-sm text-gray-600">Clients Reached</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{metrics.regionsServed}</div>
              <div className="text-sm text-gray-600">Regions Served</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {metrics.plantsAnalyzed.toLocaleString()}+
              </div>
              <div className="text-sm text-gray-600">Plants Analyzed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{metrics.carbonSequestration.toLocaleString()}+</div>
              <div className="text-sm text-gray-600">Tons CO₂ Sequestered</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="blockchain" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="blockchain" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Blockchain
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Building2 className="h-4 w-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="programs" className="gap-2">
              <Target className="h-4 w-4" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Mail className="h-4 w-4" />
              Partner with Us
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blockchain" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Blockchain-Verified Partnerships
                </h2>
                <p className="text-gray-600">
                  Partnerships recorded on Hyperledger Fabric with immutable milestone tracking
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Partnership
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading partnerships from blockchain...</p>
                </div>
              </div>
            ) : blockchainPartnerships.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShieldCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">No Blockchain Partnerships</h3>
                  <p className="text-gray-600 mb-6">
                    You don't have any partnerships recorded on the blockchain yet.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Partnership
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {blockchainPartnerships.map((partnership) => (
                  <PartnershipCard
                    key={partnership.partnershipId}
                    partnership={partnership}
                    userOrgId={userOrgId}
                    onUpdateMilestone={() => setSelectedPartnership(partnership.partnershipId)}
                    onUploadEvidence={() => setSelectedPartnership(partnership.partnershipId)}
                    onViewDetails={() => setSelectedPartnership(partnership.partnershipId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => (
                <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{partner.logo}</div>
                        <div>
                          <div className="text-lg">{partner.name}</div>
                          <Badge className={getPartnerTypeColor(partner.type)}>
                            {getPartnerTypeLabel(partner.type)}
                          </Badge>
                        </div>
                      </div>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{partner.description}</p>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Impact</div>
                      <div className="text-sm text-blue-600">{partner.impact}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Programs:</div>
                      <div className="flex flex-wrap gap-1">
                        {partner.programs.map((program, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => window.open(partner.website, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visit Website
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Urban Carbon Gardens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    High-efficiency plant cultivation for urban carbon sequestration
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• CO2-absorbing plant selection</li>
                    <li>• Urban space optimization</li>
                    <li>• Maintenance training programs</li>
                    <li>• Carbon tracking and reporting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    Reforestation Initiatives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Large-scale tree planting for carbon offset and ecosystem restoration
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Native species selection</li>
                    <li>• Drone-assisted planting</li>
                    <li>• Long-term monitoring systems</li>
                    <li>• Community engagement programs</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Research Partnership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced research on high-carbon sequestration plant species
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Hybrid plant development</li>
                    <li>• Growth optimization studies</li>
                    <li>• Climate adaptation research</li>
                    <li>• Scientific publication collaboration</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HandHeart className="h-5 w-5 text-orange-600" />
                    Community Forestry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Empowering local communities through sustainable forest management
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Skill development programs</li>
                    <li>• Sustainable harvesting techniques</li>
                    <li>• Micro-enterprise development</li>
                    <li>• Climate education initiatives</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Carbon Sequestration Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive guide on high-CO2 absorbing plant species and cultivation techniques
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plant Selection Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed database of plants optimized for carbon sequestration by climate zone
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Annual Impact Report 2024</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Report showcasing carbon sequestration achievements and partnership outcomes
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Urban Gardening Toolkit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Resources for maximizing carbon capture in urban and small-space environments
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download ZIP
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reforestation Manual</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Best practices for large-scale tree planting and ecosystem restoration
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Success Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Case studies from successful carbon sequestration projects worldwide
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Carbon Partnership Inquiry</CardTitle>
                  <CardDescription>
                    Tell us about your organization and how we can collaborate on plant-based carbon initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Organization Name</label>
                      <Input
                        value={contactForm.organization}
                        onChange={(e) => setContactForm(prev => ({ ...prev, organization: e.target.value }))}
                        placeholder="Your organization name"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@organization.org"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <Input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+254 7123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Organization Type</label>
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select organization type</option>
                        <option value="ngo">Non-Governmental Organization</option>
                        <option value="government">Government Agency</option>
                        <option value="university">University/Research Institution</option>
                        <option value="corporation">Corporation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Partnership Proposal</label>
                      <Textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Describe your carbon sequestration project, target regions, expected CO2 reduction, and collaboration goals..."
                        rows={6}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Submit Carbon Partnership Inquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Partnership Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Urban Green Corridors</h4>
                          <p className="text-sm text-gray-600">
                            Establish carbon-capturing green spaces in cities
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Carbon Data Sharing</h4>
                          <p className="text-sm text-gray-600">
                            Contribute to global carbon sequestration databases
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Hybrid Plant Research</h4>
                          <p className="text-sm text-gray-600">
                            Develop high-efficiency carbon-capturing plant varieties
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <HandHeart className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Climate Grants</h4>
                          <p className="text-sm text-gray-600">
                            Collaborate on carbon offset and climate adaptation funding
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">phr3edevelopers@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">+254 722990587</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Kamakis, Along Eastern ByPass,Nairobi</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Partnership Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Blockchain Partnership</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePartnership} className="space-y-4">
            <div>
              <Label>Partner Organization</Label>
              <Input
                placeholder="e.g., Org2MSP"
                value={createForm.partnerOrgId}
                onChange={(e) => setCreateForm({ ...createForm, partnerOrgId: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Partner Organization Name</Label>
              <Input
                placeholder="e.g., Partner Nursery Ltd."
                value={createForm.partnerOrgName}
                onChange={(e) => setCreateForm({ ...createForm, partnerOrgName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Partnership Type</Label>
              <Select
                value={createForm.partnershipType}
                onValueChange={(value) => setCreateForm({ ...createForm, partnershipType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscaping">Landscaping Project</SelectItem>
                  <SelectItem value="nursery_supply">Nursery Supply</SelectItem>
                  <SelectItem value="enterprise_contract">Enterprise Contract</SelectItem>
                  <SelectItem value="research_collaboration">Research Collaboration</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Partnership Agreement</Label>
              <Input
                type="file"
                onChange={(e) => setCreateForm({ ...createForm, agreementFile: e.target.files?.[0] || null })}
                accept=".pdf,.doc,.docx"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                The agreement file will be hashed and recorded on the blockchain
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 gap-2">
                <ShieldCheck className="h-4 w-4" />
                Create Partnership on Blockchain
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Partnership Details Modal */}
      {selectedPartnership && (
        <Dialog open={!!selectedPartnership} onOpenChange={(open) => !open && setSelectedPartnership(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Partnership Details</DialogTitle>
            </DialogHeader>
            <PartnershipDashboard
              partnershipId={selectedPartnership}
              onClose={() => setSelectedPartnership(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      <Footer />
    </div>
  );
};

export default Partnerships;