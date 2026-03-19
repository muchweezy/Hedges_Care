import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  Leaf,
  Droplets,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import type { Partnership } from '@/fabric';

interface PartnershipCardProps {
  partnership: Partnership;
  userOrgId?: string;
  onUpdateMilestone?: (partnershipId: string) => void;
  onUploadEvidence?: (partnershipId: string) => void;
  onViewDetails?: (partnershipId: string) => void;
}

const PartnershipCard: React.FC<PartnershipCardProps> = ({
  partnership,
  userOrgId,
  onUpdateMilestone,
  onUploadEvidence,
  onViewDetails
}) => {
  const partnerName = userOrgId === partnership.org1Id ? partnership.org2Name : partnership.org1Name;
  const partnerId = userOrgId === partnership.org1Id ? partnership.org2Id : partnership.org1Id;
  
  // Calculate milestone completion
  const completedMilestones = partnership.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = partnership.milestones.length;
  const completionPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get milestone status icon
  const getMilestoneStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-blue-500 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{partnerName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{partnerId}</span>
                <Badge className={getStatusColor(partnership.status)}>
                  {partnership.status}
                </Badge>
                <ShieldCheck className="h-3 w-3 text-green-600" />
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {partnership.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(partnership.startDate).toLocaleDateString()} -{' '}
            {new Date(partnership.endDate).toLocaleDateString()}
          </span>
        </div>

        {/* Milestone Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-gray-600">
              {completedMilestones}/{totalMilestones} milestones
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Environmental Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">CO₂ Absorbed</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {partnership.environmentalImpact.totalCO2Absorbed.toFixed(2)} kg
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Water Conserved</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {partnership.environmentalImpact.waterConserved.toFixed(0)} L
            </div>
          </div>
        </div>

        {/* Reputation Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium">Reputation Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-600">
              {partnership.reputationScore}
            </span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </div>

        {/* Recent Milestones */}
        {totalMilestones > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Milestones</div>
            <div className="space-y-1">
              {partnership.milestones.slice(-2).map((milestone) => (
                <div key={milestone.milestoneId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getMilestoneStatusIcon(milestone.status)}
                    <span className="text-sm">{milestone.name}</span>
                  </div>
                  {milestone.status === 'completed' && (
                    <Badge variant="outline" className="text-xs">
                      {milestone.actualValue?.toFixed(0)}/{milestone.targetValue}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onUpdateMilestone?.(partnership.partnershipId)}
        >
          <TrendingUp className="h-4 w-4" />
          Update
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onUploadEvidence?.(partnership.partnershipId)}
        >
          <ShieldCheck className="h-4 w-4" />
          Evidence
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onViewDetails?.(partnership.partnershipId)}
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PartnershipCard;
