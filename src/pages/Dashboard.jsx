import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, TrendingUp, DollarSign, Users, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import ActiveTransactionsSlider from '../components/transactions/ActiveTransactionsSlider';
import TransactionCalendarGrid from '../components/transactions/TransactionCalendarGrid';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeTransactions: 0,
    totalVolume: 0,
    clients: 0,
    completedTasks: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (txError) throw txError;

      // Fetch clients
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*');
      if (clientError) throw clientError;

      // Fetch tasks
      const { data: tasks, error: taskError } = await supabase
        .from('task_items')
        .select('*');
      if (taskError) throw taskError;

      // Stats
      const activeTransactions = transactions.filter(t => t.status?.toLowerCase().includes('active')).length;
      const totalVolume = transactions
        .filter(t => t.status?.toLowerCase().includes('active') && t.sales_price)
        .reduce((sum, t) => sum + (parseFloat(t.sales_price) || 0), 0);
      const completedTasks = tasks.filter(t => t.completed).length;

      setStats({
        activeTransactions,
        totalVolume,
        clients: clients.length,
        completedTasks
      });

      // Recent transactions
      setRecentTransactions(transactions.slice(0, 5));

      // Upcoming tasks
      const upcomingTasksList = tasks
        .filter(t => !t.completed && t.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);
      setUpcomingTasks(upcomingTasksList);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user ? `, ${user.email}` : ''}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
        </div>
        <Link to={createPageUrl('NewTransaction')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTransactions}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Active transaction value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">Total clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Transactions */}
      <ActiveTransactionsSlider />

      {/* Transactions + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.property_address}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.buyer_name || 'No buyer assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to={createPageUrl('Transactions')} className="block">
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet</p>
                <Link to={createPageUrl('NewTransaction')}>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Transaction
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.task_name}</p>
                      <p className="text-sm text-gray-600">{task.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(task.due_date)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {task.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link to={createPageUrl('Pipeline')} className="block">
                  <Button variant="outline" className="w-full">
                    View All Tasks
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionCalendarGrid />
        </CardContent>
      </Card>
    </div>
  );
}