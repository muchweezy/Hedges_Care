import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Upload, X } from 'lucide-react';
import { fabricGateway } from '@/fabric';
import type { Partnership, Milestone, Evidence } from '@/fabric';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartnershipDashboardProps {
  partnershipId: string;
  onClose?: () => void;
}

const PartnershipDashboard: React.FC<PartnershipDashboardProps> = ({ partnershipId, onClose }) => {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    targetDate: '',
    targetValue: '',
    type: 'environmental' as 'environmental' | 'financial' | 'operational'
  });
  const [updateMilestone, setUpdateMilestone] = useState({
    actualValue: '',
    evidence: null as File | null
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadPartnership();
  }, [partnershipId]);

  const loadPartnership = async () => {
    try {
      setLoading(true);
      const partnershipService = fabricGateway.getPartnershipService();
      const data = await partnershipService.getPartnership(partnershipId);
      setPartnership(data);
    } catch (error) {
      console.error('Failed to load partnership:', error);
      toast({
        title: 'Error',
        description: 'Failed to load partnership data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const partnershipService = fabricGateway.getPartnershipService();
      await partnershipService.addMilestone({
        partnershipId,
        name: newMilestone.name,
        description: newMilestone.description,
        targetDate: newMilestone.targetDate,
        targetValue: parseFloat(newMilestone.targetValue),
        milestoneType: newMilestone.type
      });
      
      toast({
        title: 'Success',
        description: 'Milestone added successfully'
      });
      
      setShowMilestoneDialog(false);
      setNewMilestone({
        name: '',
        description: '',
        targetDate: '',
        targetValue: '',
        type: 'environmental'
      });
      
      loadPartnership();
    } catch (error) {
      console.error('Failed to add milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to add milestone',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      const partnershipService = fabricGateway.getPartnershipService();
      
      let evidence: Evidence | undefined;
      if (updateMilestone.evidence) {
        const hash = await calculateFileHash(updateMilestone.evidence);
        evidence = {
          evidenceId: `evidence_${Date.now()}`,
          type: 'image',
          hash,
          uploadedBy: 'currentUser',
          uploadedAt: new Date().toISOString(),
          verified: false
        };
      }

      await partnershipService.updateMilestone({
        partnershipId,
        milestoneId: selectedMilestone.milestoneId,
        actualValue: parseFloat(updateMilestone.actualValue),
        evidence
      });
      
      toast({
        title: 'Success',
        description: 'Milestone updated successfully'
      });
      
      setShowEvidenceDialog(false);
      setUpdateMilestone({ actualValue: '', evidence: null });
      setSelectedMilestone(null);
      
      loadPartnership();
    } catch (error) {
      console.error('Failed to update milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update milestone',
        variant: 'destructive'
      });
    }
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading partnership data...</p>
        </div>
      </div>
    );
  }

  if (!partnership) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Partnership not found</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const completedMilestones = partnership.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = partnership.milestones.length;
  const completionPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Partnership Header */}
      <div className="bg-gradient-to-br from-green-500 to-blue-500 text-white p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {partnership.org1Name} ↔ {partnership.org2Name}
            </h2>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {partnership.type}
              </Badge>
              <Badge className={`${partnership.status === 'active' ? 'bg-green-500' : partnership.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'} text-white`}>
                {partnership.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{partnership.reputationScore}</div>
            <div className="text-sm text-white/80">Reputation Score</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-gray-600">
                  {completedMilestones}/{totalMilestones} milestones
                </span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {partnership.environmentalImpact.totalCO2Absorbed.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">CO₂ (kg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {partnership.environmentalImpact.treesPlanted}
                </div>
                <div className="text-sm text-gray-600">Trees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {partnership.environmentalImpact.habitatCreated.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Habitat (m²)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  {partnership.environmentalImpact.waterConserved.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Water (L)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Milestones</h3>
          <Button onClick={() => setShowMilestoneDialog(true)}>
            Add Milestone
          </Button>
        </div>

        <div className="space-y-3">
          {partnership.milestones.map((milestone, index) => (
            <Card key={milestone.milestoneId} className={milestone.status === 'completed' ? 'border-green-200' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                        {milestone.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {milestone.type}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-semibold mb-1">{milestone.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Target:</span>{' '}
                        <span className="font-medium">{milestone.targetValue}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>{' '}
                        <span className="font-medium">{new Date(milestone.targetDate).toLocaleDateString()}</span>
                      </div>
                      {milestone.actualValue !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-600">Actual:</span>{' '}
                            <span className={`font-medium ${milestone.actualValue >= milestone.targetValue ? 'text-green-600' : 'text-red-600'}`}>
                              {milestone.actualValue}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Completed:</span>{' '}
                            <span className="font-medium">
                              {milestone.actualDate ? new Date(milestone.actualDate).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {milestone.evidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">Evidence</div>
                        <div className="flex flex-wrap gap-2">
                          {milestone.evidence.map((evidence) => (
                            <Badge key={evidence.evidenceId} variant={evidence.verified ? 'default' : 'outline'} className="gap-1">
                              {evidence.verified ? <ShieldCheck className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                              {evidence.type}
                              {evidence.verified ? ' (Verified)' : ' (Pending)'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {milestone.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowEvidenceDialog(true);
                      }}
                    >
                      Update
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMilestone} className="space-y-4">
            <div>
              <Label>Milestone Name</Label>
              <Input
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="e.g., Plant 1000 trees"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Describe the milestone..."
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={newMilestone.targetValue}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: e.target.value })}
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={newMilestone.targetDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Milestone Type</Label>
              <Select
                value={newMilestone.type}
                onValueChange={(value) => setNewMilestone({ ...newMilestone, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Add Milestone</Button>
              <Button type="button" variant="outline" onClick={() => setShowMilestoneDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Milestone Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Milestone Progress</DialogTitle>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4">
              <div>
                <Label>Actual Value</Label>
                <Input
                  type="number"
                  value={updateMilestone.actualValue}
                  onChange={(e) => setUpdateMilestone({ ...updateMilestone, actualValue: e.target.value })}
                  placeholder="e.g., 950"
                />
              </div>
              <div>
                <Label>Upload Evidence (Optional)</Label>
                <Input
                  type="file"
                  onChange={(e) => setUpdateMilestone({ ...updateMilestone, evidence: e.target.files?.[0] || null })}
                  accept="image/*,.pdf"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateMilestone} className="flex-1">Update</Button>
                <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnershipDashboard;
