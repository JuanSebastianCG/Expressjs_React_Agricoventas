import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/passwordUtils';

// Inicializar Prisma client
const prisma = new PrismaClient();

interface AdminUserOptions {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

/**
 * Valida los parámetros de entrada
 */
function validateParams(options: Partial<AdminUserOptions>): string | null {
  if (!options.username) return 'El nombre de usuario es obligatorio';
  if (!options.fullName) return 'El nombre completo es obligatorio';
  if (!options.email) return 'El email es obligatorio';
  if (!options.password) return 'La contraseña es obligatoria';
  
  if (options.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  return null; // Sin errores
}

/**
 * Crea un usuario administrador con los parámetros proporcionados
 */
async function createAdminUser(options: AdminUserOptions) {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: options.username },
          { email: options.email }
        ]
      }
    });

    if (existingUser) {
      console.error(`❌ Error: Ya existe un usuario con el username "${options.username}" o el email "${options.email}"`);
      return;
    }

    // Crear el usuario
    const hashedPassword = await hashPassword(options.password);
    const newUser = await prisma.user.create({
      data: {
        username: options.username,
        fullName: options.fullName,
        email: options.email,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    });

    console.log('\n✅ Usuario administrador creado exitosamente:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log('\nPuede iniciar sesión con las credenciales proporcionadas.');

  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Función principal que analiza los argumentos y ejecuta la creación
 */
async function main() {
  console.log('\n=== CREACIÓN DE USUARIO ADMINISTRADOR (CLI) ===\n');
  
  // Extraer argumentos de la línea de comandos
  const args = process.argv.slice(2);
  const options: Partial<AdminUserOptions> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    if (!value) continue;
    
    switch (flag) {
      case '--username':
      case '-u':
        options.username = value;
        break;
      case '--fullname':
      case '-n':
        options.fullName = value;
        break;
      case '--email':
      case '-e':
        options.email = value;
        break;
      case '--password':
      case '-p':
        options.password = value;
        break;
    }
  }
  
  // Validar parámetros
  const validationError = validateParams(options as AdminUserOptions);
  if (validationError) {
    console.error(`❌ Error: ${validationError}`);
    console.log('\nUso: npx ts-node src/scripts/createAdminCLI.ts [opciones]');
    console.log('\nOpciones:');
    console.log('  -u, --username   Nombre de usuario');
    console.log('  -n, --fullname   Nombre completo');
    console.log('  -e, --email      Correo electrónico');
    console.log('  -p, --password   Contraseña (mínimo 8 caracteres)');
    console.log('\nEjemplo:');
    console.log('  npx ts-node src/scripts/createAdminCLI.ts -u admin -n "Admin Usuario" -e admin@example.com -p Password123!');
    return;
  }
  
  // Crear el usuario administrador
  await createAdminUser(options as AdminUserOptions);
}

// Ejecutar la función principal
main().catch(console.error); 