const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
    console.error('❌ Erro: Forneça o email como argumento. Ex: node scripts/delete_user.cjs email@teste.com');
    process.exit(1);
}

async function deleteUser() {
    console.log(`🔍 Buscando usuário: ${TARGET_EMAIL}...`);

    // 1. Get User ID from Admin Auth API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Erro ao listar usuários:', listError.message);
        return;
    }

    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) {
        console.log(`⚠️ Usuário ${TARGET_EMAIL} não encontrado no Auth.`);
        // Still try to delete from public table just in case of inconsistency
        await deleteFromPublicTable(TARGET_EMAIL);
        return;
    }

    const userId = user.id;
    console.log(`✅ Usuário encontrado: ${userId}`);

    // 2. Delete from Therapists Table (Public)
    await deleteFromPublicTable(TARGET_EMAIL);

    // 3. Delete from Auth (Admin)
    console.log('🗑️ Removendo do Auth...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
        console.error('❌ Erro ao deletar do Auth:', deleteError.message);
    } else {
        console.log('✅ Usuário removido do Auth com sucesso!');
    }
}

async function deleteFromPublicTable(email) {
    console.log('🗑️ Removendo da tabela therapists...');
    const { error } = await supabase
        .from('therapists')
        .delete()
        .eq('email', email);

    if (error) {
        console.error('❌ Erro ao deletar da tabela therapists:', error.message);
    } else {
        console.log('✅ Dados removidos da tabela therapists (se existiam).');
    }
}

deleteUser();
