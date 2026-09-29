import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const seedUserId='haven-demo-owner'
const passwordHash=await bcrypt.hash('demo-password-change-me',10)
db.prepare(`INSERT INTO users(id,email,password_hash,display_name,phone,role) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,role='member'`).run(seedUserId,'demo@example.test',passwordHash,'Haven Demo Owner','+95 9 000 000 000','member')
const adminHash=await bcrypt.hash('admin-password-change-me',10)
db.prepare(`INSERT INTO users(id,email,password_hash,display_name,phone,role) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,role='admin'`).run('haven-demo-admin','admin@example.test',adminHash,'Haven Demo Admin',null,'admin')
const images=['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85']
const samples=[
 ['Sunlit teak home with a garden','A calm, light-filled home with warm teak floors, a leafy courtyard and generous spaces for family life. Close to cafés and daily conveniences.','sale','House','Yangon','Bahan',485000000,4,3,2650],
 ['Quiet apartment, made for slow mornings','A thoughtfully furnished apartment with an airy balcony, natural finishes and a welcoming neighborhood feel.','rent','Apartment','Yangon','Sanchaung',1250000,2,2,1180],
 ['A little more room to breathe','A contemporary family home with a bright open living space, private garden and room to grow.','sale','House','Mandalay','Chanmyathazi',320000000,3,3,2100],
 ['Soft light, considered details','A beautiful city residence with a generous kitchen, peaceful bedrooms and thoughtful details throughout.','rent','Condo','Bago','Bago',850000,2,2,980],
 ['A welcoming place in the heart of the city','A bright and comfortable home with generous rooms, a balcony and easy access to neighborhood markets.','rent','Condo','Mandalay','Aungmyethazan',950000,2,2,1050],
 ['Room to grow, close to everything','A spacious family house with a leafy yard, quiet bedrooms and everyday amenities nearby.','sale','House','Bago','Bago',220000000,4,3,2400],
 ['A calm corner in Sanchaung','An inviting apartment with natural light, warm finishes and a practical open plan for city living.','sale','Apartment','Yangon','Sanchaung',195000000,2,2,1050],
 ['A practical home for city life','Well-kept rental with a bright living area and room for a small family.','rent','House','Mandalay','Chanayethazan',700000,3,2,1500],
 ['A little land for a big idea','Level plot in a growing neighborhood, suitable for a future home or small garden project.','sale','Land','Bago','Bago',78000000,0,0,4000],
 ['Easy living near the lake','A relaxed apartment with a breezy balcony, comfortable bedrooms and a lovely shared garden.','rent','Apartment','Yangon','Inya',1600000,2,2,1300],
 ['Simple, bright, and just right','A compact, well-planned condo with a sunny living space and thoughtful storage.','sale','Condo','Mandalay','Chanmyathazi',145000000,1,1,720],
 ['A small space for good work','Flexible commercial space with a street-facing entrance, natural light and room to welcome customers.','rent','Commercial','Bago','Bago',650000,0,1,850],
] as const
const hasSamples=(db.prepare('SELECT COUNT(*) AS n FROM listings WHERE id LIKE ?').get('sample-%') as {n:number}).n>0
if(!hasSamples){const insert=db.transaction(()=>samples.forEach((s,i)=>{const id=`sample-${i+1}`;db.prepare(`INSERT INTO listings(id,owner_id,title,description,purpose,property_type,city,township,price,currency,rent_period,bedrooms,bathrooms,area,area_unit,status,created_at,updated_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,seedUserId,s[0],s[1],s[2],s[3],s[4],s[5],s[6],'MMK',s[2]==='rent'?'monthly':null,s[7],s[8],s[9],'sqft','published',new Date(Date.now()-i*86400000).toISOString(),new Date(Date.now()-i*86400000).toISOString(),new Date(Date.now()-i*86400000).toISOString());db.prepare('INSERT INTO listing_photos(id,listing_id,url,sort_order,is_primary) VALUES(?,?,?,?,?)').run(randomUUID(),id,images[i%images.length],0,1)}));insert()}
console.log('Sample listings are ready. Demo member: demo@example.test / demo-password-change-me. Demo admin: admin@example.test / admin-password-change-me')
