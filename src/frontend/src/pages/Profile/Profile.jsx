import React, { useState } from 'react';
import { User, Mail, Shield, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';

export function Profile() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  });

  const handleSave = () => {
    // In a real app, you would call an API here
    setIsEditing(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">My Profile</h1>
        <p className="text-sm text-on-surface-variant">Manage your account information and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details and role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-2xl">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">{currentUser.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-primary border-primary/50 bg-primary-container/10">
                    <Shield className="w-3 h-3 mr-1" />
                    {currentUser.role}
                  </Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface mb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-on-surface-variant" /> Full Name
                </label>
                {isEditing ? (
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant mt-1">{formData.name}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-on-surface mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-on-surface-variant" /> Email Address
                </label>
                {isEditing ? (
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant mt-1">{formData.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface mb-1 flex items-center gap-2">
                  Role (Immutable)
                </label>
                <p className="text-sm text-on-surface-variant mt-1 cursor-not-allowed opacity-70">{currentUser.role}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
