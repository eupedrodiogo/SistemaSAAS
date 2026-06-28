const fs = require('fs');

const file = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');
const lines = file.split('\n');

const startLine = lines.findIndex(l => l.includes("          {activeTab === 'profile' && ("));
const endLine = lines.findIndex(l => l.includes("      {/* Floating Save Button */}"));

if (startLine !== -1 && endLine !== -1) {
  const replacement = `          {activeTab === 'profile' && <ProfileTab formData={formData} setFormData={setFormData} triggerToast={triggerToast} availability={availability} />}
          {activeTab === 'clinic' && <ClinicTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'network' && <NetworkTab formData={formData} setFormData={setFormData} triggerToast={triggerToast} />}
          {activeTab === 'financial' && <FinancialSettingsTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'integrations' && <IntegrationsTab integrations={integrations} setIntegrations={setIntegrations} />}
          {activeTab === 'schedule' && <ScheduleTab availability={availability} setAvailability={setAvailability} blockedTimes={blockedTimes} setBlockedTimes={setBlockedTimes} />}
          {activeTab === 'security' && <SecurityTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'notifications' && <NotificationsTab formData={formData} setFormData={setFormData} reminder15minEnabled={reminder15minEnabled} setReminder15minEnabled={setReminder15minEnabled} reminder24hEnabled={reminder24hEnabled} setReminder24hEnabled={setReminder24hEnabled} whatsappTemplate={whatsappTemplate} setWhatsappTemplate={setWhatsappTemplate} showNotification={triggerToast} />}
          {activeTab === 'help' && <HelpTab helpView={helpView} setHelpView={setHelpView} helpSearch={helpSearch} setHelpSearch={setHelpSearch} selectedArticle={selectedArticle} setSelectedArticle={setSelectedArticle} guideSection={guideSection} setGuideSection={setGuideSection} supportForm={supportForm} setSupportForm={setSupportForm} handleSendSupport={handleSendSupport} HELP_ARTICLES={HELP_ARTICLES} SYSTEM_GUIDE={SYSTEM_GUIDE} />}
        </div>
      </div>
`;
  
  const newLines = [
    ...lines.slice(0, startLine),
    replacement,
    ...lines.slice(endLine - 1)
  ];
  
  fs.writeFileSync('src/components/SettingsView.tsx', newLines.join('\n'));
  console.log('Replaced successfully');
} else {
  console.log('Start or end not found', startLine, endLine);
}
