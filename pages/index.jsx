import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Transactions from "./Transactions";

import CRM from "./CRM";

import Calendar from "./Calendar";

import TransactionDetail from "./TransactionDetail";

import Contacts from "./Contacts";

import NewTransaction from "./NewTransaction";

import Settings from "./Settings";

import Profile from "./Profile";

import Pipeline from "./Pipeline";

import Landing from "./Landing";

import Assistant from "./Assistant";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import Resources from "./Resources";

import CaliforniaDisclosures from "./CaliforniaDisclosures";

import PreSaleInspection from "./PreSaleInspection";

import RetrofitInspections from "./RetrofitInspections";

import GoogleOAuthCallbackHandler from "./GoogleOAuthCallbackHandler";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Transactions: Transactions,
    
    CRM: CRM,
    
    Calendar: Calendar,
    
    TransactionDetail: TransactionDetail,
    
    Contacts: Contacts,
    
    NewTransaction: NewTransaction,
    
    Settings: Settings,
    
    Profile: Profile,
    
    Pipeline: Pipeline,
    
    Landing: Landing,
    
    Assistant: Assistant,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    Resources: Resources,
    
    CaliforniaDisclosures: CaliforniaDisclosures,
    
    PreSaleInspection: PreSaleInspection,
    
    RetrofitInspections: RetrofitInspections,
    
    GoogleOAuthCallbackHandler: GoogleOAuthCallbackHandler,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Transactions" element={<Transactions />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/TransactionDetail" element={<TransactionDetail />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/NewTransaction" element={<NewTransaction />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Pipeline" element={<Pipeline />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Assistant" element={<Assistant />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/Resources" element={<Resources />} />
                
                <Route path="/CaliforniaDisclosures" element={<CaliforniaDisclosures />} />
                
                <Route path="/PreSaleInspection" element={<PreSaleInspection />} />
                
                <Route path="/RetrofitInspections" element={<RetrofitInspections />} />
                
                <Route path="/GoogleOAuthCallbackHandler" element={<GoogleOAuthCallbackHandler />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}