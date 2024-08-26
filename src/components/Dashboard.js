"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import ReactConfetti from 'react-confetti';
import "react-datepicker/dist/react-datepicker.css";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Radio, FileText, Menu, X, User, Newspaper, MessageSquare, LogOut, Globe, Plus, Eye, Settings as SettingsIcon, Users, PenTool, ArrowLeft, ExternalLink, FileX, Clock, Send, ArrowRight, Shield, CheckCircle, ChevronUp, AlertCircle, Quote, Briefcase, Tags, Image as ImageIcon, HelpCircle, Loader, Edit, Save, Upload, LayoutDashboardIcon, Calendar, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select';
import "react-datepicker/dist/react-datepicker.css";


// const URL = 'http://localhost:3001';
 const URL = 'https://api.raydeeo.com';


const categories = [
  "Agriculture & Farming", "Arts & Entertainment", "Australia", "Automotive", "Books & Literature",
  "Building & Construction", "Business", "Celebrity", "Commodity Market", "Computers & Software",
  "Education", "Electronics & Semiconductors", "Employment", "Energy & Environment", "Europe",
  "Family & Parenting", "Fashion & Beauty", "Finance", "Financial Market", "Fitness",
  "Food & Beverage", "Gaming", "Government & Politics", "Health & Medicine", "Home & Garden",
  "Hospitality", "India", "Law & Legal", "Leisure Activities", "Lifestyle",
  "Living", "Manufacturing & Industry", "Marketing & Sales", "Media & Communications", "News & Current Affairs",
  "Non Profit", "Personal Finance", "Pharmaceuticals & Biotech", "Professional Services", "Public Affairs",
  "Real Estate", "Retail", "Science", "Services", "Shopping & Deal",
  "Society & Culture", "Sports", "Technology", "Telecom", "Transportation & Logistics",
  "Travel", "U.K", "U.S", "Website & Blog", "World"
];

const featuredSites = [
    { domain: 'theglobeandmail.com', name: 'The Globe and Mail', logo: URL + '/uploads/globe.png' },
    { domain: 'benzinga.com', name: 'Benzinga', logo: URL + '/uploads/benzinga.png' },
    { domain: 'barchart.com', name: 'Barchart', logo: URL + '/uploads/barchart.png' }
  ];

  
  const MinimalProgressIndicator = ({ currentStep, completedSteps, isWritingOwn }) => {
    const getSteps = () => {
      if (isWritingOwn) {
        return [
          { value: "0", icon: PenTool },
          { value: "1", icon: FileText },
          { value: "2", icon: Briefcase },
          { value: "3", icon: Tags },
          { value: "4", icon: ImageIcon },
          { value: "5", icon: Calendar },
          { value: "6", icon: CheckCircle }
        ];
      } else {
        return [
          { value: "0", icon: AlertCircle },
          { value: "1", icon: FileText },
          { value: "2", icon: Quote },
          { value: "3", icon: Briefcase },
          { value: "4", icon: Tags },
          { value: "5", icon: ImageIcon },
          { value: "6", icon: Calendar },
          { value: "7", icon: CheckCircle }
        ];
      }
    };
  
    const steps = getSteps();
  
    return (
      <div className="flex justify-between items-center w-full py-4 px-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index <= completedSteps;
          const isCurrent = index === parseInt(currentStep);
          
          return (
            <div key={step.value} className="flex-1 flex items-center">
              <div 
                className={`relative flex items-center justify-center w-8 h-8 rounded-full 
                  ${isCompleted ? 'bg-black' : 'bg-gray-200'}
                  ${isCurrent ? 'ring-2 ring-black ring-offset-2' : ''}
                `}
              >
                <StepIcon 
                  className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-500'}`} 
                />
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`flex-1 h-0.5 mx-1
                    ${index < completedSteps ? 'bg-black' : 'bg-gray-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  
  const InitialInfoScreen = ({ onStart, onSelectOwnWrite }) => {
    return (
      <div className="text-center max-w-4xl mx-auto p-4">
        <Radio className="h-16 w-16 text-black m-auto" />
        <h2 className="text-2xl font-bold mb-4">Welcome to Raydeeo</h2>
        <p className="mb-6">Choose how you'd like to create your press release:</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div 
            onClick={() => onStart()}
            className="border p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center"
          >
            <Users className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="font-bold mb-2">Help Me Write It</h3>
            <p className="text-sm">We'll guide you through a series of questions to craft your press release.</p>
          </div>
  
          <div 
            onClick={() => onSelectOwnWrite()}
            className="border p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center"
          >
            <PenTool className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="font-bold mb-2">Write My Own</h3>
            <p className="text-sm">Write your own press release and submit it directly for distribution.</p>
          </div>
        </div>
      </div>
    );
  };
  
  
const AdminPanel = ({ user }) => {
    const [releases, setReleases] = useState([]);
    const [error, setError] = useState(null);
    const [selectedRelease, setSelectedRelease] = useState(null);
    const [updateMessage, setUpdateMessage] = useState(null);
  
    useEffect(() => {
      fetchReleases();
    }, []);
  
    const fetchReleases = async () => {
      try {
        const response = await axios.get(URL + '/admin/releases', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setReleases(response.data);
      } catch (err) {
        setError('Failed to fetch releases');
        console.error('Error fetching releases:', err);
      }
    };
    
  
    const handleStatusChange = async (releaseId, newStatus) => {
      try {
        await axios.put(URL + `/admin/releases/${releaseId}/status`, 
          { status: newStatus },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        fetchReleases();
      } catch (err) {
        setError('Failed to update release status');
        console.error('Error updating release status:', err);
      }
    };
  
    const handleResultsUpdate = async (releaseId, resultsString) => {
      setError(null);
      setUpdateMessage(null);
      try {
        let results;
        try {
          results = JSON.parse(resultsString);
        } catch (parseError) {
          setError('Invalid JSON format. Please check your input.');
          return;
        }
  
        if (!Array.isArray(results)) {
          setError('Results must be an array of URLs.');
          return;
        }
  
        // Ensure we're sending an array of strings
        results = results.filter(url => typeof url === 'string' && url.trim() !== '');
  
        console.log('Sending results to server:', results);
        
        const response = await axios.put(URL + `/admin/releases/${releaseId}/results`, 
          { results },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        console.log('Server response:', response.data);
        
        setUpdateMessage('Results updated successfully');
        fetchReleases();
      } catch (err) {
        setError('Failed to update release results');
        console.error('Error updating release results:', err.response?.data || err.message);
      }
    };
  
    const renderHtmlContent = (content) => {
      return { __html: content };
    };
  
    if (!user.legacy) {
      return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Access Denied</AlertTitle><AlertDescription>You do not have admin privileges.</AlertDescription></Alert>;
    }
  
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {updateMessage && <Alert variant="success"><AlertCircle className="h-4 w-4" /><AlertTitle>Success</AlertTitle><AlertDescription>{updateMessage}</AlertDescription></Alert>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map((release) => (
              <TableRow key={release._id}>
                <TableCell>{release.title}</TableCell>
                <TableCell>
                    <img src={URL + `${release.imageUrl}`} alt={release.title} className="w-16 h-16 object-cover rounded-lg" />
                </TableCell>
                <TableCell>
                  <Select 
                    onValueChange={(value) => handleStatusChange(release._id, value)} 
                    defaultValue={release.status}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedRelease(release)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Content
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{selectedRelease?.title}</DialogTitle>
                        </DialogHeader>
                        {selectedRelease && (
                          <div dangerouslySetInnerHTML={renderHtmlContent(selectedRelease.content)} />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Textarea
                      placeholder="Paste results JSON here"
                      defaultValue={JSON.stringify(release.results || [], null, 2)}
                      className="w-full h-32"
                    />
                    <Button
                      onClick={(e) => handleResultsUpdate(release._id, e.target.previousSibling.value)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Update Results
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

const SuccessDialog = ({ isOpen, onClose }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Press Release Submitted Successfully!</DialogTitle>
            <DialogDescription>
              Congratulations! Your press release has been approved and is now being processed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Processing</AlertTitle>
              <AlertDescription>Your release will begin appearing on news sites in a few hours.</AlertDescription>
            </Alert>
            <Alert>
              <Newspaper className="h-4 w-4" />
              <AlertTitle>Publication Report</AlertTitle>
              <AlertDescription>A full report of where your release has been published will be available in ~24 hours.</AlertDescription>
            </Alert>
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertTitle>Journalist Interest</AlertTitle>
              <AlertDescription>You may start hearing from interested journalists soon.</AlertDescription>
            </Alert>
          </div>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
    );
  };


  const ResultsDialog = ({ isOpen, onClose, results }) => {
    const getDisplayUrl = (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
      } catch (error) {
        return url.split('/')[2] || url;
      }
    };
  
    const featuredResults = results.filter(url => 
      featuredSites.some(site => url.includes(site.domain))
    );
  
    const otherResults = results.filter(url => 
      !featuredSites.some(site => url.includes(site.domain))
    );
  
    const totalWebsites = results.length;
    const googleNewsLink = results.find(url => url.includes('google.com'));
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Press Release Results</DialogTitle>
            <DialogDescription>
              Your press release has been published on the following sites:
            </DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{totalWebsites}</span>
              <span className="ml-2 text-gray-600">
                Website{totalWebsites !== 1 ? 's' : ''} Published
              </span>
            </div>
  
            {googleNewsLink && (
              <a 
                href={googleNewsLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <img src="https://api.raydeeo.com/uploads/gnews.png" alt="Google News" className="h-6 w-6 mr-2" />
                  <span className="text-lg font-semibold">Google News</span>
                </div>
                <ExternalLink className="h-5 w-5 text-blue-500" />
              </a>
            )}
          </div>
  
          {featuredResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Premium Publications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredResults.map((url, index) => {
                  const site = featuredSites.find(site => url.includes(site.domain));
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <img src={site.logo} alt={site.name} className="h-12 mb-2" />
                      <span className="text-sm text-center text-blue-600 hover:underline">{site.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
  
          <ScrollArea className="h-[300px] w-full pr-4 mt-6">
            <h3 className="text-lg font-semibold mb-2">All Publications</h3>
            {otherResults.map((url, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span className="truncate mr-2 flex-grow">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {getDisplayUrl(url)}
                  </a>
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

const StatusBar = ({ status }) => {
    const stages = ['approved', 'processing', 'published'];
    const currentStageIndex = status ? stages.indexOf(status.toLowerCase()) : -1;
  
    const getColor = (index) => {
      if (currentStageIndex >= 2) return 'text-green-500';
      if (currentStageIndex >= 1) return 'text-yellow-500';
      if (currentStageIndex >= 0) return 'text-blue-500';
      return 'text-gray-300';
    };
  
    const getBgColor = (index) => {
      if (currentStageIndex >= 2) return 'bg-green-500';
      if (currentStageIndex >= 1) return 'bg-yellow-500';
      if (currentStageIndex >= 0) return 'bg-blue-500';
      return 'bg-gray-200';
    };
  
    return (
      <div className="flex items-center justify-between w-full mt-4">
        {stages.map((stage, index) => (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStageIndex ? getBgColor(index) : 'bg-gray-200'
                }`}
              >
                {stage === 'approved' && <CheckCircle className="w-5 h-5 text-white" />}
                {stage === 'processing' && <Clock className="w-5 h-5 text-white" />}
                {stage === 'published' && <Send className="w-5 h-5 text-white" />}
              </div>
              <span className={`text-xs mt-2 capitalize ${index <= currentStageIndex ? getColor(index) + ' font-semibold' : 'text-gray-500'}`}>
                {stage}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`flex-grow h-0.5 relative top-[-14px] ${
                  index < currentStageIndex ? getBgColor(index + 1) : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };  
  
  
  const Settings = () => {
    const [contactInfo, setContactInfo] = useState({
      companyName: '',
      contactName: '',
      contactTitle: '',
      contactEmail: '',
      contactUrl: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
  
    useEffect(() => {
      fetchContactInfo();
    }, []);
  
    const fetchContactInfo = async () => {
      try {
        const response = await axios.get(URL + '/user/contact-info', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setContactInfo(response.data);
      } catch (err) {
        console.error('Error fetching contact info:', err);
        setError('Failed to fetch contact information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleInputChange = (field, value) => {
        setContactInfo(prev => ({ ...prev, [field]: value }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      setSaveMessage(null);
      try {
        await axios.put(URL + '/user/contact-info', contactInfo, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSaveMessage({ type: 'success', text: 'Contact information saved successfully.' });
      } catch (err) {
        console.error('Error saving contact info:', err);
        setSaveMessage({ type: 'error', text: 'Failed to save contact information. Please try again.' });
      } finally {
        setIsSaving(false);
      }
    };
  
    if (isLoading) {
      return;
    }
  
    if (error) {
      return <div className="p-4 text-red-500">{error}</div>;
    }
  
    return (
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
                This information will be the default for your press releases. Make sure it&apos;s accurate - this is what journalists will use to contact you.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={contactInfo.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={contactInfo.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactTitle">Contact Title</Label>
                  <Input
                    id="contactTitle"
                    name="contactTitle"
                    value={contactInfo.contactTitle}
                    onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={contactInfo.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactUrl">Website URL</Label>
                  <Input
                    id="contactUrl"
                    name="contactUrl"
                    type="url"
                    value={contactInfo.contactUrl}
                    onChange={(e) => handleInputChange('contactUrl', e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
            {saveMessage && (
              <Alert className={`mt-4 ${saveMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                <AlertCircle className={`h-4 w-4 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                <AlertTitle>{saveMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWriteOwnStep = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PenTool className="mr-2 h-5 w-5" />
            Write Your Own Press Release
          </DialogTitle>
          <DialogDescription>
            Write your press release title and content below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={parsedTitle}
              onChange={(e) => setParsedTitle(e.target.value)}
              placeholder="Enter your press release title"
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={parsedContent}
              onChange={(e) => setParsedContent(e.target.value)}
              placeholder="Write your press release content here"
              rows={10}
            />
          </div>
        </div>
      </>
    );
  };

const Dashboard = ({ onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [releaseData, setReleaseData] = useState({
    about: '',
    background: '',
    quote: '',
    companyName: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactUrl: '',
    categories: [],
    image: null,
    generatedRelease: ''
  });

  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [parsedTitle, setParsedTitle] = useState('');
  const [parsedContent, setParsedContent] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishOption, setPublishOption] = useState('asap');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [isFixing, setIsFixing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeView, setActiveView] = useState('releases');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedResults, setSelectedResults] = useState([]);
  const [showInitialInfo, setShowInitialInfo] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(-1);
  const [isWritingOwn, setIsWritingOwn] = useState(false);
  const [ownTitle, setOwnTitle] = useState('');
const [ownContent, setOwnContent] = useState('');

  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);

  const isStepComplete = () => {
    switch (wizardStep) {
      case 0:
        return isWritingOwn ? ownTitle.trim() !== '' : releaseData.about.trim() !== '';
      case 1:
        return isWritingOwn ? ownContent.trim() !== '' : releaseData.background.trim() !== '';
      case 2:
        return isWritingOwn ? (
          releaseData.companyName.trim() !== '' &&
          releaseData.contactName.trim() !== '' &&
          releaseData.contactTitle.trim() !== '' &&
          releaseData.contactEmail.trim() !== '' &&
          releaseData.contactUrl.trim() !== '' &&
          validateUrl(releaseData.contactUrl)
        ) : releaseData.quote.trim() !== '';
      case 3:
        return isWritingOwn ? 
          (releaseData.categories.length > 0 && releaseData.categories.length <= 3) : 
          (releaseData.companyName.trim() !== '' && releaseData.contactName.trim() !== '' && 
           releaseData.contactTitle.trim() !== '' && releaseData.contactEmail.trim() !== '' && 
           releaseData.contactUrl.trim() !== '' && validateUrl(releaseData.contactUrl));
      case 4:
        return isWritingOwn ? releaseData.image !== null : 
          (releaseData.categories.length > 0 && releaseData.categories.length <= 3);
      case 5:
        return isWritingOwn ? 
          (publishOption === 'asap' || (publishOption === 'scheduled' && scheduledDate > new Date())) : 
          releaseData.image !== null;
      case 6:
        return isWritingOwn ? true : 
          (publishOption === 'asap' || (publishOption === 'scheduled' && scheduledDate > new Date()));
      default:
        return true;
    }
  };

  useEffect(() => {
    fetchReleases();
    fetchUserData();
    fetchContactInfo();
    checkPaymentStatus();
  }, []);

  const handleViewResults = (results) => {
    setSelectedResults(results);
    setShowResultsDialog(true);
  };

  const handleStartWizard = () => {
    setShowInitialInfo(false);
    setWizardStep(0);
    setCompletedSteps(0);
  };

  const fetchReleases = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(URL + '/releases', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReleases(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch releases. Please try again.');
      console.error('Error fetching releases:', err);
    }
    setIsLoading(false);
  };

  const handleStepChange = (step) => {
    setWizardStep(parseInt(step));
  };

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      try {
        setPaymentStatus({ type: 'loading', message: 'Processing payment...' });
        const response = await axios.post(URL + '/payment-success', { session_id: sessionId }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          setPaymentStatus({ 
            type: 'success', 
            message: `Payment successful! ${response.data.creditsAdded} credits added to your account. New balance: ${response.data.newCreditBalance} credits.` 
          });
          fetchUserData(); // Refresh user data to update credit display
        } else {
          throw new Error('Payment processing failed');
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentStatus({ 
          type: 'error', 
          message: `There was an error processing your payment: ${error.response?.data?.details || error.message}. Please contact support.` 
        });
      } finally {
        // Remove the session_id from the URL
        window.history.replaceState({}, document.title, "/");
      }
    }
  };

  const handleBuyCredits = async (productId) => {
    try {
      const response = await axios.post(URL + '/create-checkout-session', { productId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.sessionUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Error: ${error.response?.data?.details || error.message}`);
    }
  };

  const renderCreditsDialog = () => (
    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Coins className="h-6 w-6 mr-2 mb-6" />
            Buy Credits
            </DialogTitle>
          <DialogDescription>
            Each press releases uses 1 credit to generate, review and distribute. Raydeeo offers discounts based on the number of credits you purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button onClick={() => handleBuyCredits('prod_QjESD3WgWxLtlb')}>
            1 Credit - $99
          </Button>
          <Button onClick={() => handleBuyCredits('prod_QjET2GV4Ok1jFL')}>
            3 Credits - $249
          </Button>
          <Button onClick={() => handleBuyCredits('prod_QjETFhXJzcxEiW')}>
            5 Credits - $349
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );


  const fetchUserData = async () => {
    try {
      const response = await axios.get(URL + '/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserData(response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data. Please try again.');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          mainContentRef.current && 
          mainContentRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(URL + '/user/contact-info', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContactInfo(response.data);
    } catch (err) {
      console.error('Error fetching contact info:', err);
      setError('Failed to fetch contact information. Please try again.');
    }
  };

  const handleOpenWizard = async () => {
    const hasCredits = await checkCreditBalance();
    if (hasCredits) {
      setReleaseData(prevData => ({
        ...prevData,
        companyName: contactInfo?.companyName || '',
        contactName: contactInfo?.contactName || '',
        contactTitle: contactInfo?.contactTitle || '',
        contactEmail: contactInfo?.contactEmail || '',
        contactUrl: contactInfo?.contactUrl || ''
      }));
      setInsufficientCredits(false);
      setShowInitialInfo(true);
      setIsWritingOwn(false);
    } else {
      setInsufficientCredits(true);
    }
    setIsWizardOpen(true);
  };
  
  const handleSelectOwnWrite = () => {
    setIsWritingOwn(true);
    setShowInitialInfo(false);
    setWizardStep(0);
    setCompletedSteps(0);
  };
  

  const handleInputChange = (field, value) => {
    setReleaseData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category) => {
    setReleaseData(prev => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: updatedCategories.slice(0, 3) };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size should be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          if (img.width >= 400 && img.height >= 300) {
            setReleaseData(prev => ({ ...prev, image: file }));
            setError(null);
          } else {
            setError('Image must be at least 400x300 pixels.');
          }
        };
        img.onerror = () => {
          setError('Invalid image file.');
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setError('Error reading file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishOptionChange = (value) => {
    setPublishOption(value);
  };

  const handleViewDetails = (release) => {
    setSelectedRelease(release);
  };

  const renderFormattedContent = (content) => {
    const formattedContent = content.replace(
      /<p>/g,
      '<p class="mb-8 last:mb-0">'
    ).replace(
      /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g,
      '<a href="$1" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$2</a>'
    );
  
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  const handleSettingsClick = () => {
    setActiveView('settings');
  };

  const handleReleasesClick = () => {
    setActiveView('releases');
  };


  const renderMainContent = () => {
    switch (activeView) {
      case 'settings':
        return <Settings />;
      case 'admin':
        return <AdminPanel user={userData} />;
      case 'releases':
      default:
        return (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-xl font-semibold mb-4">Your Releases</h2>
              {isLoading ? (
                // Loading skeletons
                [...Array(6)].map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))
            ) : releases.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4">
                  {releases.map((release) => (
                    <Card key={release._id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      {release.imageUrl ? (
                        <img
                          src={URL + `${release.imageUrl}`}
                          alt={release.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{release.title}</CardTitle>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(release.createdAt).toLocaleDateString()}
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => handleViewDetails(release)}>
                        View Details
                      </Button>
                      
                        {release.status === 'published' && (
                            <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => handleViewResults(release.results)}
                            >
                                View Results
                            </Button>
                        )}
                      

                    </CardContent>
                    <CardFooter>
                    <StatusBar status={release.status} />
                    
                    </CardFooter>
                    </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] w-full">
                <FileX className="h-24 w-24 text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No releases yet</p>
                <p className="text-gray-500 mb-4">Create your first release to get started</p>
                <Button onClick={handleOpenWizard} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-5 w-5" /> Create New Release
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  const renderReleaseDetails = () => {
    if (!selectedRelease) return null;

    return (
      <Dialog open={!!selectedRelease} onOpenChange={() => setSelectedRelease(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">{selectedRelease.title}</DialogTitle>
            <DialogDescription>
              Created on {new Date(selectedRelease.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {selectedRelease.imageUrl && (
              <img
                src={URL + `${selectedRelease.imageUrl}`}
                alt="Release image"
                className="w-full h-64 object-cover rounded-md mb-6"
              />
            )}
            <div className="prose max-w-none">
            {renderFormattedContent(selectedRelease.content)}
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
            <p className="mb-1"><span className="font-medium">Company:</span> {selectedRelease.companyName}</p>
            <p className="mb-1"><span className="font-medium">Contact:</span> {selectedRelease.contactName}, {selectedRelease.contactTitle}</p>
            <p className="mb-1"><span className="font-medium">Email:</span> {selectedRelease.contactEmail}</p>
            <p className="mb-1">
              <span className="font-medium">Website:</span>{' '}
              <a 
                href={selectedRelease.contactUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {selectedRelease.contactUrl}
              </a>
            </p>
          </div>
          <div className="mt-6">
            <h4 className="font-semibold text-lg mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {selectedRelease.categories.map((category, index) => (
                <Badge key={index} variant="secondary">{category}</Badge>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setSelectedRelease(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const parseGeneratedRelease = (rawContent) => {
    const titleMatch = rawContent.match(/^###\s*(.*?)\s*###/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const content = rawContent.replace(/^###.*?###/, '').trim();
      return { title, content };
    } else {
      return { title: '', content: rawContent.trim() };
    }
  };

  const checkCreditBalance = async () => {
    try {
      const response = await axios.get(URL + '/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.credits > 0;
    } catch (error) {
      console.error('Error checking credit balance:', error);
      return false;
    }
  };


  const handleSubmitForReview = async () => {
    setIsReviewing(true);
    try {
      const response = await axios.post(URL + '/review-release', {
        title: isWritingOwn ? ownTitle : parsedTitle,
        content: isWritingOwn ? ownContent : parsedContent
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReviewFeedback(response.data);
      if (response.data.passed) {
        await handleSaveRelease();
        await fetchUserData();
        await fetchReleases();
      }
    } catch (error) {
      setError('Failed to submit release for review. Please try again.');
      console.error('Error submitting release for review:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGenerateRelease = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      Object.keys(releaseData).forEach(key => {
        if (key === 'image') {
          if (releaseData.image) {
            formData.append('image', releaseData.image);
          }
        } else if (key === 'categories') {
          formData.append('categories', JSON.stringify(releaseData.categories));
        } else {
          formData.append(key, releaseData[key]);
        }
      });
  
      formData.append('publishOption', publishOption);
      if (publishOption === 'scheduled') {
        formData.append('scheduledDate', scheduledDate.toISOString());
      }
  
      if (followUpAnswer) {
        formData.append('followUpAnswer', followUpAnswer);
      }
  
      const response = await axios.post(URL + '/generate-release', formData, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.generatedRelease.startsWith('#####ERROR#####')) {
        const errorMessage = response.data.generatedRelease.replace('#####ERROR#####', '').trim();
        setFollowUpQuestion(errorMessage);
        setWizardStep(8); // Move to the follow-up question step
      } else {
        const { title, content } = parseGeneratedRelease(response.data.generatedRelease);
        setParsedTitle(title);
        setParsedContent(content);
        setReleaseData(prev => ({ ...prev, generatedRelease: response.data.generatedRelease }));
        setWizardStep(7); // Move to the review step
        setFollowUpQuestion('');
        setFollowUpAnswer('');
      }
    } catch (err) {
      setError('Failed to generate release. Please try again.');
      console.error('Error generating release:', err);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    setIsEditing(false);
    if (isWritingOwn) {
      setOwnTitle(ownTitle);
      setOwnContent(ownContent);
    } else {
      setReleaseData(prev => ({ 
        ...prev, 
        generatedRelease: `${parsedTitle}\n###\n${parsedContent}` 
      }));
    }
  };

  const validateUrl = (url) => {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(url);
  };

  const renderReleaseCard = (release) => (
    <Card key={release._id} className="overflow-hidden">
      <CardHeader className="p-0">
        {release.imageUrl ? (
          <img
            src={URL + `${release.imageUrl}`}
            alt={release.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg">{release.title}</CardTitle>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Created: {new Date(release.createdAt).toLocaleDateString()}
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-grow" onClick={() => handleViewDetails(release)}>
            View Details
          </Button>
          {release.status === 'published' && release.results && release.results.length > 0 && (
            <Button onClick={() => handleViewResults(release.results)}>
              Results
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <StatusBar status={release.status} />
      </CardFooter>
    </Card>
  );

  const renderContactInfo = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Contact Information
          </DialogTitle>
          <DialogDescription>
            Provide details about your company and contact person. This information will be included in your press release.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Company or Project Name"
            value={releaseData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
          />
          <Input
            placeholder="Contact Name"
            value={releaseData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
          />
          <Input
            placeholder="Contact Title"
            value={releaseData.contactTitle}
            onChange={(e) => handleInputChange('contactTitle', e.target.value)}
          />
          <Input
            placeholder="Contact Email"
            type="email"
            value={releaseData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          />
          <Input
            placeholder="URL (e.g., https://www.example.com)"
            type="text"
            value={releaseData.contactUrl}
            onChange={(e) => handleInputChange('contactUrl', e.target.value)}
          />
          {releaseData.contactUrl && !validateUrl(releaseData.contactUrl) && (
            <p className="text-red-500 text-sm">Please enter a valid URL</p>
          )}
        </div>
      </>
    );
  };
  

  const handleSaveRelease = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', isWritingOwn ? ownTitle : parsedTitle);
      formData.append('content', isWritingOwn ? ownContent : parsedContent);
      formData.append('companyName', releaseData.companyName);
      formData.append('contactName', releaseData.contactName);
      formData.append('contactTitle', releaseData.contactTitle);
      formData.append('contactEmail', releaseData.contactEmail);
      formData.append('contactUrl', releaseData.contactUrl);
      formData.append('categories', JSON.stringify(releaseData.categories));
      formData.append('publishOption', publishOption);
      if (publishOption === 'scheduled') {
        formData.append('scheduledDate', scheduledDate.toISOString());
      }
  
      if (releaseData.image) {
        formData.append('image', releaseData.image);
      }
  
      console.log('Saving release with data:', Object.fromEntries(formData));
      const response = await axios.post(URL + '/releases', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Save response:', response.data);
      setReleases([response.data, ...releases]);
      
      // Reset all states
      setIsWizardOpen(false);
      setWizardStep(0);
      setCompletedSteps(-1);
      setIsWritingOwn(false);
      setOwnTitle('');
      setOwnContent('');
      setParsedTitle('');
      setParsedContent('');
      setReviewFeedback(null);
      setFollowUpQuestion('');
      setFollowUpAnswer('');
      setPublishOption('asap');
      setScheduledDate(new Date());
      setReleaseData({
        about: '',
        background: '',
        quote: '',
        companyName: '',
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        contactUrl: '',
        categories: [],
        image: null,
        generatedRelease: ''
      });
      setIsEditing(false);
      setError(null);
  
      await fetchUserData();
  
      setShowConfetti(true);
      setShowSuccessDialog(true);
  
      setTimeout(() => setShowConfetti(false), 5000);
  
    } catch (err) {
      console.error('Error saving release:', err.response ? err.response.data : err.message);
      setError(`Failed to save release: ${err.response ? err.response.data.error : err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderParsedContent = (content) => {
    const paragraphs = content.split('</p><p>');
    
    const wrapLinks = (text) => {
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g;
      return text.replace(linkRegex, (match, href, linkText) => {
        return `<a href="${href}" style="text-decoration: underline; color: blue;">${linkText}</a>`;
      });
    };

    return (
      <div>
        {paragraphs.map((paragraph, index) => (
          <p key={index} dangerouslySetInnerHTML={{ __html: wrapLinks(paragraph) }} style={{ marginBottom: '1em' }} />
        ))}
      </div>
    );
  };

  const renderErrorMessage = () => {
    if (!isStepComplete()) {
      switch (wizardStep) {
        case 0:
          return <p className="text-red-500 mt-2">Please provide information about your release.</p>;
        case 1:
          return <p className="text-red-500 mt-2">Please provide background details.</p>;
        case 2:
          return <p className="text-red-500 mt-2">Please provide a quote from a spokesperson.</p>;
        case 3:
          return <p className="text-red-500 mt-2">Please fill in all contact information fields and ensure the URL is valid.</p>;
        case 4:
          return <p className="text-red-500 mt-2">Please select 1-3 categories.</p>;
        case 5:
          return <p className="text-red-500 mt-2">Please upload an image for your press release.</p>;
        case 6:
          return <p className="text-red-500 mt-2">Please select a valid publish option and date (if scheduling).</p>;
        default:
          return null;
      }
    }
    return null;
  };

  const handleFixRelease = async () => {
    setIsFixing(true);
    try {
      const response = await axios.post(URL + '/fix-release', {
        title: isWritingOwn ? ownTitle : parsedTitle,
        content: isWritingOwn ? ownContent : parsedContent,
        feedback: reviewFeedback.reasons
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (isWritingOwn) {
        setOwnTitle(response.data.title);
        setOwnContent(response.data.content);
      } else {
        setParsedTitle(response.data.title);
        setParsedContent(response.data.content);
      }
      setReviewFeedback(null);
    } catch (error) {
      setError('Failed to fix release. Please try again.');
      console.error('Error fixing release:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const renderReviewFeedback = () => {
    if (!reviewFeedback) return null;

    if (reviewFeedback.passed) {
      return (
        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Review Passed</AlertTitle>
          <AlertDescription>
            Your release has passed the review and has been saved.
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review Failed</AlertTitle>
          <AlertDescription>
            Your release did not pass the review. Please address the following issues:
            <ul className="list-disc pl-5 mt-2">
              {reviewFeedback.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      );
    }
  };

  const renderPublishOptions = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Choose Publish Option
          </DialogTitle>
          <DialogDescription>
            Select when you want to publish your release.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={publishOption} onValueChange={handlePublishOptionChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="asap" id="asap" />
            <Label htmlFor="asap">Publish ASAP</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="scheduled" />
            <Label htmlFor="scheduled">Schedule for later</Label>
          </div>
        </RadioGroup>
        {publishOption === 'scheduled' && (
          <div className="mt-20 mb-5">
            <Label htmlFor="scheduledDate">Select Date and Time</Label>
            <DatePicker
              selected={scheduledDate}
              onChange={(date) => setScheduledDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 border rounded"
              id="scheduledDate"
              wrapperClassName="date-picker-wrapper"
            />
          </div>
        )}
      </>
    );
  };

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 0:
        return isWritingOwn ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <PenTool className="mr-2 h-5 w-5" />
                Enter Your Press Release Title
              </DialogTitle>
              <DialogDescription>
                Provide a concise and informative title for your press release.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={ownTitle}
              onChange={(e) => setOwnTitle(e.target.value)}
              placeholder="Enter your press release title"
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                What is this release about?
              </DialogTitle>
              <DialogDescription>
                Provide a brief sentence describing the main topic of your press release.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="E.g., Launching a new AI-powered writing assistant"
              value={releaseData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
            />
          </>
        );
      case 1:
        return isWritingOwn ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Enter Your Press Release Content
              </DialogTitle>
              <DialogDescription>
                Paste or write your press release content below. HTML formatting is supported for links.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={ownContent}
              onChange={(e) => setOwnContent(e.target.value)}
              placeholder="Paste or write your press release content here..."
              rows={15}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                What are some important background details?
              </DialogTitle>
              <DialogDescription>
                Provide any relevant context or background information.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="E.g., Our company has been developing this technology for 2 years..."
              value={releaseData.background}
              onChange={(e) => handleInputChange('background', e.target.value)}
            />
          </>
        );
      case 2:
        return isWritingOwn ? renderContactInfo() : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Quote className="mr-2 h-5 w-5" />
                Provide a quote from a spokesperson
              </DialogTitle>
              <DialogDescription>
                Include a quote from the creator or a company representative.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="E.g., 'We're excited to bring this innovative solution to market...'"
              value={releaseData.quote}
              onChange={(e) => handleInputChange('quote', e.target.value)}
            />
          </>
        );
      case 3:
        return isWritingOwn ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Tags className="mr-2 h-5 w-5" />
                Select Categories
              </DialogTitle>
              <DialogDescription>
                Choose 1-3 categories that best describe your press release.
              </DialogDescription>
            </DialogHeader>
            <div className="h-[300px] overflow-y-auto space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={releaseData.categories.includes(category)}
                    onCheckedChange={() => handleCategoryChange(category)}
                    disabled={releaseData.categories.length >= 3 && !releaseData.categories.includes(category)}
                  />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </div>
          </>
        ) : renderContactInfo();
      case 4:
        return isWritingOwn ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Upload Image
              </DialogTitle>
              <DialogDescription>
                Upload an image for your press release (minimum 400x300 pixels). This is necessary to be listed on Google News.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {releaseData.image && <p className="text-green-500">Image uploaded successfully.</p>}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Tags className="mr-2 h-5 w-5" />
                Select Categories
              </DialogTitle>
              <DialogDescription>
                Choose 1-3 categories that best describe your press release.
              </DialogDescription>
            </DialogHeader>
            <div className="h-[300px] overflow-y-auto space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={releaseData.categories.includes(category)}
                    onCheckedChange={() => handleCategoryChange(category)}
                    disabled={releaseData.categories.length >= 3 && !releaseData.categories.includes(category)}
                  />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </div>
          </>
        );
      case 5:
        return isWritingOwn ? renderPublishOptions() : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Upload Image
              </DialogTitle>
              <DialogDescription>
                Upload an image for your press release (minimum 400x300 pixels). This is necessary to be listed on Google News.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {releaseData.image && <p className="text-green-500">Image uploaded successfully.</p>}
          </>
        );
        case 6:
            return isWritingOwn ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Review Your Press Release
                  </DialogTitle>
                  <DialogDescription>
                    Review your press release and make any necessary edits.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {isEditing ? (
                    <>
                      <Input
                        value={ownTitle}
                        onChange={(e) => setOwnTitle(e.target.value)}
                        className="font-bold text-xl mb-2"
                        placeholder="Enter your press release title"
                      />
                      <Textarea
                        value={ownContent}
                        onChange={(e) => setOwnContent(e.target.value)}
                        rows={15}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your press release content"
                      />
                      <Button onClick={handleSaveEdit} className="mt-2">
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <div className="prose max-w-none">
                      <h1 className="text-2xl font-bold mb-4">{ownTitle}</h1>
                      {renderFormattedContent(ownContent)}
                    </div>
                  )}
                  <Button onClick={handleEdit} className="mt-4">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
                {renderReviewFeedback()}
                <div className="flex justify-between mt-4">
                  {reviewFeedback && !reviewFeedback.passed && (
                    <Button 
                      onClick={handleFixRelease} 
                      disabled={isFixing}
                      variant="secondary"
                    >
                      {isFixing ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        <>
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Fix for me
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    onClick={handleSubmitForReview} 
                    disabled={isReviewing || isSaving} 
                  >
                    {isReviewing ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Reviewing...
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {reviewFeedback && !reviewFeedback.passed ? 'Re-submit for Review' : 'Submit for Review'}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : renderPublishOptions();
          
            case 7:
                return !isWritingOwn ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Review Your Press Release
                      </DialogTitle>
                      <DialogDescription>
                        Review your press release and make any necessary edits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      {isEditing ? (
                        <>
                          <Input
                            value={parsedTitle}
                            onChange={(e) => setParsedTitle(e.target.value)}
                            className="font-bold text-xl mb-2"
                            placeholder="Enter your press release title"
                          />
                          <Textarea
                            value={parsedContent}
                            onChange={(e) => setParsedContent(e.target.value)}
                            rows={15}
                            className="w-full p-2 border rounded"
                            placeholder="Enter your press release content"
                          />
                          <Button onClick={handleSaveEdit} className="mt-2">
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="prose max-w-none">
                            <h1 className="text-2xl font-bold mb-4">{parsedTitle}</h1>
                            {renderFormattedContent(parsedContent)}
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <Button onClick={handleEdit}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    {renderReviewFeedback()}
                    <div className="flex justify-between mt-4">
                      {reviewFeedback && !reviewFeedback.passed && (
                        <Button 
                          onClick={handleFixRelease} 
                          disabled={isFixing}
                          variant="secondary"
                        >
                          {isFixing ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            <>
                              <HelpCircle className="mr-2 h-4 w-4" />
                              Fix for me
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        onClick={handleSubmitForReview} 
                        disabled={isReviewing || isSaving || isEditing}
                      >
                        {isReviewing ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Reviewing...
                          </>
                        ) : isSaving ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {reviewFeedback && !reviewFeedback.passed ? 'Re-submit for Review' : 'Submit for Review'}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : null;
      default:
        case 8:
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Additional Information Needed
                  </DialogTitle>
                  <DialogDescription>
                    Please provide the following additional information to generate your press release.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">{followUpQuestion}</p>
                  <Textarea
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="Provide your answer here..."
                    rows={5}
                  />
                </div>
              </>
            );
        return null;
    }
  };

  const handleNextStep = () => {
    if (isStepComplete()) {
      if (isWritingOwn && wizardStep < 6) {
        setWizardStep(wizardStep + 1);
        setCompletedSteps(Math.max(completedSteps, wizardStep + 1));
      } else if (!isWritingOwn && wizardStep < 7) {
        setWizardStep(wizardStep + 1);
        setCompletedSteps(Math.max(completedSteps, wizardStep + 1));
      } else {
        if (isWritingOwn) {
          // Handle submission for write your own
          handleSubmitForReview();
        } else {
          handleGenerateRelease();
        }
      }
    } else {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const handlePreviousStep = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`bg-white shadow-md flex-shrink-0 w-64 fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-screen`}
      >
         <div className="flex flex-col h-full">
          <div className="p-4 flex flex-col items-center justify-center">
            <Radio className="h-8 w-8 text-gray-900 mb-2" />
            <span className="text-3xl font-bold text-gray-900">Raydeeo</span>
          </div>
          <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogTrigger asChild>
              <Button className="mx-4 mt-4 mb-2 bg-gray-900 hover:bg-gray-800 text-white" onClick={handleOpenWizard}>
                <Plus className="mr-2 h-5 w-5" /> Create New Release
              </Button>
            </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80%] overflow-scroll">
          {insufficientCredits ? (
            <>
              <DialogHeader>
                <DialogTitle>
                    <Coins className="mr-2 h-6 w-6 mb-6" />
                    Insufficient Credits
                    </DialogTitle>
                <DialogDescription>
                  You don&apos;t have any credits to create a new press release. Buy credits to create, edit, and distribute your press releases to over 400 new sites.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => {
                    setIsWizardOpen(false);
                    setIsPaymentDialogOpen(true);
                  }}
                >
                  <Coins className="mr-2 h-4 w-4" />
                  Buy Credits
                </Button>
              </div>
            </>
                   ) : showInitialInfo ? (
                    <InitialInfoScreen onStart={handleStartWizard} onSelectOwnWrite={handleSelectOwnWrite} />
                  ) : (
                    <>
                     <MinimalProgressIndicator currentStep={wizardStep.toString()} completedSteps={completedSteps} isWritingOwn={isWritingOwn} />
                    {renderWizardStep()}
                    <DialogFooter>
  {wizardStep > 0 && (
    <Button variant="outline" onClick={handlePreviousStep}>
      <ArrowLeft className="mr-2 h-4 w-4" /> Back
    </Button>
  )}
  {isWritingOwn ? (
    // Buttons for when user is writing their own press release
    wizardStep < 6 && (
      <Button onClick={handleNextStep} disabled={!isStepComplete()}>
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    )
  ) : (
    // Buttons for AI-generated press release
    <>
      {wizardStep < 6 && (
        <Button onClick={handleNextStep} disabled={!isStepComplete()}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      {wizardStep === 6 && (
        <Button onClick={handleGenerateRelease} disabled={isGenerating || !isStepComplete()}>
          {isGenerating ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      )}
      {wizardStep === 8 && (
        <Button onClick={handleGenerateRelease} disabled={isGenerating || !followUpAnswer.trim()}>
          {isGenerating ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Again <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </>
  )}
</DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
          <nav className="mt-4 flex-grow">
            <Button 
              variant="ghost" 
              className={`w-full justify-start pl-4 mb-2 ${activeView === 'releases' ? 'bg-gray-100' : ''}`} 
              onClick={() => { handleReleasesClick(); setSidebarOpen(false); }}
            >
              <FileText className="mr-2 h-5 w-5" /> Releases
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start pl-4 mb-2 ${activeView === 'settings' ? 'bg-gray-100' : ''}`} 
              onClick={() => { handleSettingsClick(); setSidebarOpen(false); }}
            >
              <SettingsIcon className="mr-2 h-5 w-5" /> Settings
            </Button>
            {userData?.legacy && (
            <Button 
    variant="ghost" 
    className={`w-full justify-start pl-4 mb-2 ${activeView === 'admin' ? 'bg-gray-100' : ''}`} 
    onClick={() => { setActiveView('admin'); setSidebarOpen(false); }}
  >
    <Shield className="mr-2 h-5 w-5" /> Admin Panel
  </Button>
)}
          </nav>
          <div className="mt-auto">
            <Button variant="ghost" onClick={onLogout} className="w-full justify-start pl-4 mb-2">
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start pl-4 py-10 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-left">{userData?.name || 'Loading...'}</p>
                      <p className="text-xs text-gray-500 text-left">{userData?.email || 'Loading...'}</p>
                    </div>
                  </div>
                </Button>
              </DialogTrigger>
              {/* ... (DialogContent for profile remains the same) */}
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <button className="md:hidden" onClick={toggleSidebar}>
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center ml-auto">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <Coins className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">You have <b>{userData?.credits || 0}</b> credit{userData?.credits !== 1 ? 's' : ''}</span>
              </div>
              <Button onClick={() => setIsPaymentDialogOpen(true)} className="ml-4">
                <Coins className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {showConfetti && <ReactConfetti />}
      <SuccessDialog isOpen={showSuccessDialog} onClose={() => setShowSuccessDialog(false)} />
      {renderReleaseDetails()}
      {renderCreditsDialog()}
      <ResultsDialog 
        isOpen={showResultsDialog} 
        onClose={() => setShowResultsDialog(false)} 
        results={selectedResults} 
      />
      <style jsx global>{`
        .datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker-wrapper,
        .react-datepicker__input-container {
          display: block;
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
        }
        .date-picker-wrapper {
          display: block;
          width: 100%;
        }
        .react-datepicker-wrapper,
        .react-datepicker__input-container {
          display: block;
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker__time-list {
          padding-left: 0;
          padding-right: 0;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;