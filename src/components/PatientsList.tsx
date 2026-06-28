import React, { useState, useEffect } from 'react';
import { Patient } from 'types';
import WhatsAppModal from './WhatsAppModal';
import AddSUDModal from './AddSUDModal';
import { toast } from 'sonner';
import { usePatientsList, useCreatePatient, useUpdatePatient, useDeletePatient, useCreatePatientSUD } from '../features/patients/api/usePatients';
import { PatientsGrid } from '../features/patients/components/PatientsGrid';
import { PatientEditModal } from '../features/patients/components/PatientEditModal';
import { PatientRecordModal } from '../features/patients/components/PatientRecordModal';

interface PatientsListProps {
  highlightPatientId?: string | null;
  onNavigateToSession?: () => void;
  onNavigateToAgenda?: (patientId: string, patientName?: string) => void;
}

const ClientsList: React.FC<PatientsListProps> = ({ highlightPatientId, onNavigateToSession, onNavigateToAgenda }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Ativo' | 'Inativo' | 'Leads'>('Todos');
  
  const { data: patients = [], isLoading: loading } = usePatientsList();
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();
  const createPatientSUDMutation = useCreatePatientSUD();

  // Full Record Modal State
  const [viewingClient, setViewingClient] = useState<Patient | null>(null);

  // Edit/Add Modal State
  const [editingClient, setEditingClient] = useState<Patient | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<Patient | null>(null);

  // SUD State
  const [isSUDModalOpen, setIsSUDModalOpen] = useState(false);
  const [addingSUD, setAddingSUD] = useState(false);

  useEffect(() => {
    if (highlightPatientId) {
      const p = patients.find(pat => pat.id === highlightPatientId);
      if (p) {
        setViewingClient(p);
        setSearchTerm(p.name);
      }
    }
  }, [highlightPatientId, patients]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja arquivar este cliente?')) {
      try {
        await deletePatientMutation.mutateAsync(id);
        toast.success('Cliente arquivado com sucesso.');
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Erro ao excluir cliente. Tente novamente.');
      }
    }
  };

  const handleEdit = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    if (p) {
      setEditingClient(p);
      setEditForm(p);
    }
  };

  const handleSaveEdit = async () => {
    if (isAddingClient && editForm.name) {
      try {
        await createPatientMutation.mutateAsync({
          ...editForm,
          status: editForm.status || 'Ativo',
        });
        setIsAddingClient(false);
        toast.success('Cliente criado com sucesso!');
      } catch (error) {
        console.error('Error creating patient:', error);
        toast.error('Erro ao criar cliente.');
      }
    } else if (editingClient && editForm) {
      try {
        const { total_invested, pending_amount, nextSession, ...updateData } = editForm as any;
        await updatePatientMutation.mutateAsync({ id: editingClient.id, data: updateData });
        setEditingClient(null);
        toast.success('Cliente atualizado com sucesso!');
      } catch (error) {
        console.error('Error updating patient:', error);
        toast.error('Erro ao atualizar cliente.');
      }
    }
  };

  const handleAddNewClient = () => {
    setEditForm({ name: '', email: '', phone: '', status: 'Ativo' });
    setIsAddingClient(true);
  };

  const handleViewRecord = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    if (p) {
      setViewingClient(p);
    }
  };

  const handleWhatsApp = (patient: Patient) => {
    setWhatsAppTarget(patient);
    setIsWhatsAppModalOpen(true);
  };

  const handleSaveSUD = async (score: number, notes: string) => {
    if (!viewingClient) return;
    setAddingSUD(true);
    try {
      const therapistStr = localStorage.getItem('therapist');
      const therapist = therapistStr ? JSON.parse(therapistStr) : null;

      await createPatientSUDMutation.mutateAsync({
        therapistId: therapist?.id,
        patientId: viewingClient.id,
        score,
        notes
      });
      setIsSUDModalOpen(false);
      toast.success('SUD registrado com sucesso!');
    } catch (error) {
      console.error("Error saving SUD:", error);
      toast.error('Erro ao salvar SUD.');
    } finally {
      setAddingSUD(false);
    }
  };

  return (
    <>
      <PatientsGrid
        patients={patients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        handleAddNewClient={handleAddNewClient}
        handleViewRecord={handleViewRecord}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleWhatsApp={handleWhatsApp}
        onNavigateToAgenda={onNavigateToAgenda}
      />

      {viewingClient && (
        <PatientRecordModal
          patient={viewingClient}
          onClose={() => setViewingClient(null)}
          handleWhatsApp={handleWhatsApp}
          onNavigateToAgenda={onNavigateToAgenda}
        />
      )}

      {(editingClient || isAddingClient) && (
        <PatientEditModal
          editingClient={editingClient}
          isAddingClient={isAddingClient}
          editForm={editForm}
          setEditForm={setEditForm}
          setEditingClient={setEditingClient}
          setIsAddingClient={setIsAddingClient}
          handleSaveEdit={handleSaveEdit}
        />
      )}

      <AddSUDModal
        isOpen={isSUDModalOpen}
        onClose={() => setIsSUDModalOpen(false)}
        onSave={handleSaveSUD}
        loading={addingSUD}
      />

      {whatsAppTarget && (
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          patient={whatsAppTarget}
          therapistName={JSON.parse(localStorage.getItem('therapist') || '{}').name || 'Especialista'}
        />
      )}
    </>
  );
};

export default ClientsList;