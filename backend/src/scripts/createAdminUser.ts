import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/passwordUtils';
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';

// Inicializar Prisma client
const prisma = new PrismaClient();

// Interfaz para leer del terminal
const rl = readline.createInterface({ input, output });

/**
 * Pregunta al usuario y devuelve su respuesta
 * @param question Pregunta a mostrar
 * @param defaultValue Valor por defecto (opcional)
 */
const askQuestion = (question: string, defaultValue?: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(`${question}${defaultValue ? ` (default: ${defaultValue})` : ''}: `, (answer) => {
      resolve(answer || defaultValue || '');
    });
  });
};

/**
 * Función principal para crear un usuario administrador
 */
async function createAdminUser() {
  console.log('\n=== CREACIÓN DE USUARIO ADMINISTRADOR ===\n');
  
  try {
    // Recoger información del usuario
    const username = await askQuestion('Nombre de usuario');
    const fullName = await askQuestion('Nombre completo');
    const email = await askQuestion('Correo electrónico');
    const password = await askQuestion('Contraseña (mínimo 8 caracteres con mayúsculas, minúsculas, números y caracteres especiales)');

    // Validaciones básicas
    if (!username || !fullName || !email || !password) {
      console.error('❌ Error: Todos los campos son obligatorios');
      return;
    }

    if (password.length < 8) {
      console.error('❌ Error: La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      console.error(`❌ Error: Ya existe un usuario con el username "${username}" o el email "${email}"`);
      return;
    }

    // Crear el usuario
    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
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
    rl.close();
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
createAdminUser().catch(console.error); 