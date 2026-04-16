import { PrismaClient, UserRole, PropertyStatus, PropertyCondition } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean existing data ───
  await prisma.payment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.clientPropertyInterest.deleteMany();
  await prisma.propertyFeature.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123", 12);

  // ─── ADMIN USER ───
  const admin = await prisma.user.create({
    data: {
      email: "admin@melior.com.do",
      passwordHash,
      firstName: "Admin",
      lastName: "Melior",
      phone: "+1 809-555-0000",
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  // ─── AGENT USERS ───
  const anaUser = await prisma.user.create({
    data: {
      email: "ana.garcia@melior.com.do",
      passwordHash,
      firstName: "Ana",
      lastName: "García",
      phone: "+1 809-555-0101",
      role: UserRole.AGENT,
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    },
  });

  const carlosUser = await prisma.user.create({
    data: {
      email: "carlos.mendez@melior.com.do",
      passwordHash,
      firstName: "Carlos",
      lastName: "Méndez",
      phone: "+1 809-555-0102",
      role: UserRole.AGENT,
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    },
  });

  const lauraUser = await prisma.user.create({
    data: {
      email: "laura.reyes@melior.com.do",
      passwordHash,
      firstName: "Laura",
      lastName: "Reyes",
      phone: "+1 809-555-0103",
      role: UserRole.AGENT,
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    },
  });

  // Agent profiles
  const anaAgent = await prisma.agentProfile.create({
    data: {
      userId: anaUser.id,
      company: "Melior Properties",
      bio: "Especialista en propiedades de lujo en Cap Cana y Punta Cana",
      specialization: "Lujo, Villas",
      yearsExperience: 8,
      rating: 4.9,
      totalSales: 45,
      isVerified: true,
    },
  });

  const carlosAgent = await prisma.agentProfile.create({
    data: {
      userId: carlosUser.id,
      company: "Melior Properties",
      bio: "Experto en penthouses y apartamentos en Santo Domingo",
      specialization: "Penthouses, Apartamentos",
      yearsExperience: 12,
      rating: 4.8,
      totalSales: 67,
      isVerified: true,
    },
  });

  const lauraAgent = await prisma.agentProfile.create({
    data: {
      userId: lauraUser.id,
      company: "Melior Properties",
      bio: "Asesora de bienes raíces con enfoque en familias",
      specialization: "Casas familiares, Alquileres",
      yearsExperience: 6,
      rating: 4.7,
      totalSales: 38,
      isVerified: true,
    },
  });

  // ─── CLIENT USERS ───
  const client1 = await prisma.user.create({
    data: {
      email: "maria.fernandez@gmail.com",
      passwordHash,
      firstName: "María",
      lastName: "Fernández",
      phone: "+1 809-555-0201",
      role: UserRole.CLIENT,
      clientProfile: {
        create: { budget: 500000, preferredContact: "email", notes: "Busca villa en Cap Cana" },
      },
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: "roberto.sanchez@gmail.com",
      passwordHash,
      firstName: "Roberto",
      lastName: "Sánchez",
      phone: "+1 809-555-0202",
      role: UserRole.CLIENT,
      clientProfile: {
        create: { budget: 1000000, preferredContact: "phone", notes: "Inversionista interesado en múltiples propiedades" },
      },
    },
  });

  const client3 = await prisma.user.create({
    data: {
      email: "lucia.martinez@gmail.com",
      passwordHash,
      firstName: "Lucía",
      lastName: "Martínez",
      phone: "+1 809-555-0203",
      role: UserRole.CLIENT,
      clientProfile: {
        create: { budget: 300000, preferredContact: "whatsapp" },
      },
    },
  });

  // ─── ADDRESSES ───
  const addr1 = await prisma.address.create({
    data: { city: "Punta Cana", neighborhood: "Cap Cana", country: "DO", latitude: 18.5046, longitude: -68.3735 },
  });
  const addr2 = await prisma.address.create({
    data: { city: "Santo Domingo", neighborhood: "Naco", country: "DO", latitude: 18.4748, longitude: -69.9318 },
  });
  const addr3 = await prisma.address.create({
    data: { city: "Santo Domingo", neighborhood: "Los Jardines", country: "DO", latitude: 18.4861, longitude: -69.9387 },
  });
  const addr4 = await prisma.address.create({
    data: { city: "Santo Domingo", neighborhood: "Arroyo Hondo", country: "DO", latitude: 18.5014, longitude: -69.9570 },
  });
  const addr5 = await prisma.address.create({
    data: { city: "Santo Domingo", neighborhood: "Piantini", country: "DO", latitude: 18.4625, longitude: -69.9310 },
  });
  const addr6 = await prisma.address.create({
    data: { city: "Santo Domingo", neighborhood: "Bella Vista", country: "DO", latitude: 18.4559, longitude: -69.9380 },
  });

  // ─── PROPERTIES (matching frontend data) ───
  const properties = [
    {
      title: "Villa de Lujo con Vista al Mar",
      slug: "villa-de-lujo-con-vista-al-mar",
      description: "Experimente el epítome del lujo caribeño en esta impresionante villa frente al mar. Ubicada en la prestigiosa comunidad de Cap Cana, esta propiedad ofrece vistas panorámicas ininterrumpidas y acceso directo a playas de arena blanca. Acabados de primera calidad, piscina infinita privada y amplios espacios de entretenimiento.",
      price: 1200000, currency: "USD", status: PropertyStatus.SALE, condition: PropertyCondition.NEW,
      propertyType: "Villa", beds: 5, baths: 4, size: 380, lotSize: 800, yearBuilt: 2023, parkingSpaces: 3,
      isFeatured: true, addressId: addr1.id, agentId: anaAgent.id,
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Piscina Infinita", "Vista al Mar", "Playa Privada", "Smart Home", "Seguridad 24/7", "Terraza"],
    },
    {
      title: "Penthouse Moderno en Torre Premium",
      slug: "penthouse-moderno-en-torre-premium",
      description: "Penthouse de diseño contemporáneo con terraza privada de 80m² y vistas 360° a la ciudad. Cocina gourmet italiana, pisos de mármol importado y domótica completa. Edificio con amenidades de primer nivel: gimnasio, piscina, área social.",
      price: 850000, currency: "USD", status: PropertyStatus.SALE, condition: PropertyCondition.NEW,
      propertyType: "Penthouse", beds: 3, baths: 3, size: 260, yearBuilt: 2024, parkingSpaces: 2,
      isFeatured: true, addressId: addr2.id, agentId: carlosAgent.id,
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Terraza Privada", "Domótica", "Gimnasio", "Piscina", "Vista 360°", "Mármol Importado"],
    },
    {
      title: "Apartamento con Vista al Jardín Botánico",
      slug: "apartamento-con-vista-al-jardin-botanico",
      description: "Hermoso apartamento con vista verde al Jardín Botánico Nacional. Remodelado con acabados modernos, cocina abierta con isla central, y balcón amplio. Ubicación privilegiada con fácil acceso a la 27 de Febrero.",
      price: 285000, currency: "USD", status: PropertyStatus.SALE, condition: PropertyCondition.USED,
      propertyType: "Apartamento", beds: 3, baths: 2, size: 145, yearBuilt: 2018, parkingSpaces: 1,
      isFeatured: false, addressId: addr3.id, agentId: anaAgent.id,
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Vista Verde", "Cocina Abierta", "Balcón", "Remodelado"],
    },
    {
      title: "Casa Familiar en Arroyo Hondo",
      slug: "casa-familiar-en-arroyo-hondo",
      description: "Espaciosa casa familiar con patio amplio, piscina y área de BBQ. Distribución ideal para familias con 4 habitaciones, sala de estar doble altura y cochera para 3 vehículos. Zona tranquila y segura con vigilancia 24/7.",
      price: 420000, currency: "USD", status: PropertyStatus.SALE, condition: PropertyCondition.USED,
      propertyType: "Casa", beds: 4, baths: 3, size: 280, lotSize: 450, yearBuilt: 2015, parkingSpaces: 3,
      isFeatured: false, addressId: addr4.id, agentId: lauraAgent.id,
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Piscina", "BBQ", "Patio Amplio", "Vigilancia 24/7", "Doble Altura"],
    },
    {
      title: "Studio Moderno en Piantini",
      slug: "studio-moderno-en-piantini",
      description: "Studio completamente amueblado y equipado en el corazón de Piantini. Diseño minimalista, electrodomésticos premium y acceso a todas las amenidades del edificio. Ideal para profesionales jóvenes.",
      price: 1800, currency: "USD", status: PropertyStatus.RENT, condition: PropertyCondition.USED,
      propertyType: "Studio", beds: 1, baths: 1, size: 65, yearBuilt: 2022, parkingSpaces: 1,
      isFeatured: false, addressId: addr5.id, agentId: carlosAgent.id,
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Amueblado", "Electrodomésticos Premium", "Minimalista"],
    },
    {
      title: "Apartamento Amueblado en Bella Vista",
      slug: "apartamento-amueblado-en-bella-vista",
      description: "Elegante apartamento completamente amueblado con decoración de diseñador. Dos habitaciones amplias con baño privado, cocina moderna totalmente equipada y área de lavado. Edificio con seguridad 24/7, gimnasio y piscina.",
      price: 2500, currency: "USD", status: PropertyStatus.RENT, condition: PropertyCondition.USED,
      propertyType: "Apartamento", beds: 2, baths: 2, size: 120, yearBuilt: 2021, parkingSpaces: 1,
      isFeatured: true, addressId: addr6.id, agentId: lauraAgent.id,
      images: [
        "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1200",
      ],
      features: ["Amueblado", "Decoración de Diseñador", "Gimnasio", "Piscina", "Seguridad 24/7"],
    },
  ];

  for (const prop of properties) {
    const { images, features, ...data } = prop;

    const created = await prisma.property.create({ data });

    // Add images
    for (let i = 0; i < images.length; i++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: created.id,
          url: images[i],
          sortOrder: i,
          isPrimary: i === 0,
          altText: created.title,
        },
      });
    }

    // Add features
    for (const feature of features) {
      await prisma.propertyFeature.create({
        data: {
          propertyId: created.id,
          name: feature,
          category: "general",
        },
      });
    }
  }

  // ─── SAMPLE INQUIRIES ───
  const allProperties = await prisma.property.findMany({ take: 2 });

  await prisma.contactInquiry.create({
    data: {
      firstName: "Pedro",
      lastName: "Díaz",
      email: "pedro.diaz@email.com",
      phone: "+1 809-555-0301",
      message: "Me interesa la villa en Cap Cana. ¿Podría agendar una visita?",
      subject: "Visita a propiedad",
      propertyId: allProperties[0]?.id,
    },
  });

  await prisma.contactInquiry.create({
    data: {
      firstName: "Carmen",
      lastName: "Rosario",
      email: "carmen.rosario@email.com",
      phone: "+1 809-555-0302",
      message: "Busco un apartamento en Santo Domingo para inversión. ¿Qué opciones tienen?",
      subject: "Inversión inmobiliaria",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║  📧 Login Credentials                         ║
  ║─────────────────────────────────────────────────║
  ║  Admin:  admin@melior.com.do / Password123     ║
  ║  Agent:  ana.garcia@melior.com.do / Password123║
  ║  Agent:  carlos.mendez@melior.com.do           ║
  ║  Agent:  laura.reyes@melior.com.do             ║
  ║  Client: maria.fernandez@gmail.com             ║
  ║  Client: roberto.sanchez@gmail.com             ║
  ║  Client: lucia.martinez@gmail.com              ║
  ║  (all use password: Password123)               ║
  ╚═══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
