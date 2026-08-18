<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NepalGeoSchemaSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('countries')->updateOrInsert(['code' => 'NP'], [
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'name' => 'Nepal',
            'phone_code' => '+977',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $countryId = DB::table('countries')->where('code', 'NP')->value('id');

        $provinces = [
            ['name' => 'Koshi Province', 'code' => 'P1'],
            ['name' => 'Madhesh Province', 'code' => 'P2'],
            ['name' => 'Bagmati Province', 'code' => 'P3'],
            ['name' => 'Gandaki Province', 'code' => 'P4'],
            ['name' => 'Lumbini Province', 'code' => 'P5'],
            ['name' => 'Karnali Province', 'code' => 'P6'],
            ['name' => 'Sudurpashchim Province', 'code' => 'P7'],
        ];

        foreach ($provinces as $province) {
            DB::table('provinces')->updateOrInsert(
                ['name' => $province['name']],
                [
                    'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                    'country_id' => $countryId,
                    'code' => $province['code'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $districts = [
            'Koshi Province' => ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
            'Madhesh Province' => ['Bara', 'Dhanusa', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
            'Bagmati Province' => ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
            'Gandaki Province' => ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
            'Lumbini Province' => ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Eastern Rukum', 'Gulmi', 'Kapilvastu', 'Palpa', 'Parasi', 'Pyuthan', 'Rolpa', 'Rupandehi'],
            'Karnali Province' => ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Western Rukum'],
            'Sudurpashchim Province' => ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
        ];

        $majorCities = [
            'Kathmandu' => ['Kathmandu', 'Budhanilkantha', 'Tokha', 'Kirtipur', 'Tarakeshwar', 'Chandragiri', 'Nagarkot'],
            'Lalitpur' => ['Lalitpur', 'Godawari', 'Mahalaxmi'],
            'Bhaktapur' => ['Bhaktapur', 'Madhyapur Thimi', 'Suryabinayak'],
            'Morang' => ['Biratnagar', 'Urlabari', 'Rangeli', 'Letang'],
            'Sunsari' => ['Dharan', 'Inaruwa', 'Itahari', 'Duhabi'],
            'Jhapa' => ['Mechinagar', 'Birtamod', 'Bhadrapur', 'Damak', 'Gauradaha', 'Arjundhara'],
            'Kaski' => ['Pokhara', 'Lekhnath'],
            'Rupandehi' => ['Bhairahawa', 'Butwal', 'Devdaha', 'Siddharthanagar'],
            'Chitwan' => ['Bharatpur', 'Ratnanagar', 'Kalika'],
            'Banke' => ['Nepalgunj', 'Kohalpur'],
            'Kailali' => ['Dhangadhi', 'Tikapur', 'Lamki Chuha', 'Godawari'],
            'Kanchanpur' => ['Bhimdatta', 'Shuklaphanta', 'Bedkot', 'Mahakali'],
            'Bardiya' => ['Gulariya', 'Rajapur', 'Madhuwan'],
            'Dang' => ['Ghorahi', 'Tulsipur', 'Lamahi'],
            'Surkhet' => ['Birendranagar', 'Bheriganga'],
            'Udayapur' => ['Katari', 'Triyuga'],
            'Saptari' => ['Rajbiraj', 'Kanchanpur'],
            'Dhanusa' => ['Janakpur', 'Mithila', 'Dhanauji'],
            'Mahottari' => ['Jaleshwar', 'Bardibas', 'Gaushala'],
            'Sarlahi' => ['Malangwa', 'Hariwan', 'Lalbandi'],
            'Siraha' => ['Siraha', 'Lahan'],
            'Parsa' => ['Birgunj', 'Bahudarmai'],
            'Bara' => ['Kalaiya', 'Nijgadh', 'Jitpur Simara'],
            'Rautahat' => ['Gaur', 'Chandrapur'],
            'Makwanpur' => ['Hetauda', 'Thaha'],
            'Nawalpur' => ['Kawasoti', 'Devchuli', 'Gaindakot'],
            'Parasi' => ['Ramgram', 'Sunawal', 'Bardaghat'],
            'Baglung' => ['Baglung', 'Galkot'],
            'Syangja' => ['Putalibazar', 'Waling', 'Bhirkot'],
            'Lamjung' => ['Besisahar', 'Sundarbazar', 'Rainas'],
            'Tanahun' => ['Damauli', 'Byas', 'Shuklagandaki', 'Bhimad'],
            'Gorkha' => ['Gorkha', 'Palungtar'],
            'Palpa' => ['Tansen', 'Rampur'],
            'Arghakhanchi' => ['Sandhikharka', 'Shitaganga'],
            'Gulmi' => ['Resunga', 'Musikot'],
            'Pyuthan' => ['Pyuthan', 'Swargadwari'],
            'Rolpa' => ['Liwang', 'Rolpa'],
            'Eastern Rukum' => ['Putha Uttarganga', 'Sisne'],
            'Western Rukum' => ['Musikot', 'Chaurjahari'],
            'Salyan' => ['Salyan', 'Bagchaur', 'Sharada'],
            'Dailekh' => ['Narayan', 'Dullu', 'Aathbis'],
            'Jajarkot' => ['Khalanga', 'Bheri'],
            'Kalikot' => ['Khandachakra', 'Tilagupha'],
            'Humla' => ['Simikot', 'Sarkegad'],
            'Jumla' => ['Chandannath', 'Tila'],
            'Dolpa' => ['Thuli Bheri', 'Tripura Sundari'],
            'Mugu' => ['Chayanath Rara', 'Mugum Karmarong'],
            'Achham' => ['Mangalsen', 'Sanphebagar', 'Kamalbazar'],
            'Doti' => ['Dipayal Silgadhi', 'Shikhar'],
            'Bajhang' => ['Jaya Prithvi', 'Bungal', 'Thalara'],
            'Bajura' => ['Badimalika', 'Triveni', 'Budhinanda'],
            'Baitadi' => ['Dasharathchand', 'Patan', 'Purchaudi'],
            'Dadeldhura' => ['Amargadhi', 'Parshuram', 'Aalitaal'],
            'Darchula' => ['Mahakali', 'Shailyashikhar', 'Apihimal'],
            'Ilam' => ['Ilam', 'Deumai', 'Mai Jogmai'],
            'Panchthar' => ['Phidim', 'Hile', 'Yangwarak'],
            'Taplejung' => ['Phungling', 'Maiwa Khola'],
            'Dhankuta' => ['Dhankuta', 'Pakhribas', 'Sangurigadhi'],
            'Terhathum' => ['Myanglung', 'Laligurans'],
            'Sankhuwasabha' => ['Khandbari', 'Chainpur', 'Madi'],
            'Bhojpur' => ['Bhojpur', 'Shadanand'],
            'Solukhumbu' => ['Solu Dudhkunda', 'Khotang'],
            'Okhaldhunga' => ['Siddhicharan', 'Molung'],
            'Khotang' => ['Diktel Rupakot Majhuwagadhi', 'Halesi Tuwachung'],
            'Ramechhap' => ['Manthali', 'Ramechhap'],
            'Dolakha' => ['Bhimeshwar', 'Jiri', 'Kalinchok'],
            'Sindhupalchok' => ['Chautara', 'Melamchi', 'Barhabise'],
            'Rasuwa' => ['Kalika', 'Naukunda'],
            'Dhading' => ['Dhading Besi', 'Nilkantha', 'Dhunibeshi'],
            'Nuwakot' => ['Bidur', 'Kakani', 'Likhu'],
            'Kavrepalanchok' => ['Dhulikhel', 'Banepa', 'Panauti', 'Panchkhal'],
            'Sindhuli' => ['Kamalamai', 'Dudhauli'],
            'Manang' => ['Chame', 'Narpa Bhumi'],
            'Mustang' => ['Lomanthang', 'Gharapjhong'],
            'Myagdi' => ['Beni', 'Annapurna', 'Dhaulagiri'],
            'Parbat' => ['Kusma', 'Phalewas'],
            'Kapilvastu' => ['Kapilvastu', 'Buddhabhumi', 'Maharajgunj'],
            'Nawalpur' => ['Kawasoti', 'Devchuli', 'Gaindakot'],
        ];

        foreach ($districts as $provinceName => $districtNames) {
            $provinceId = DB::table('provinces')->where('name', $provinceName)->value('id');

            foreach ($districtNames as $districtName) {
                DB::table('districts')->updateOrInsert(
                    ['name' => $districtName, 'province_id' => $provinceId],
                    [
                        'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                        'code' => strtoupper(\Illuminate\Support\Str::slug($districtName, '')),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        // Seed all 753 official Municipalities and Rural Municipalities from resources/js/location.js
        $locationFile = resource_path('js/location.js');
        if (file_exists($locationFile)) {
            $content = file_get_contents($locationFile);
            $pos = strpos($content, '[');
            $rpos = strrpos($content, ']');
            if ($pos !== false && $rpos !== false) {
                $json = substr($content, $pos, $rpos - $pos + 1);
                $localLevels = json_decode($json, true);

                $districtAliasMap = [
                    'TANAHU' => 'Tanahun',
                    'NAWALPARASI EAST' => 'Nawalpur',
                    'NAWALPARASI WEST' => 'Parasi',
                    'RUKUM EAST' => 'Eastern Rukum',
                    'RUKUM WEST' => 'Western Rukum',
                    'KAPILBASTU' => 'Kapilvastu',
                    'DHANUSA' => 'Dhanusa',
                ];

                if (is_array($localLevels)) {
                    foreach ($localLevels as $item) {
                        $rawDist = strtoupper(trim($item['District'] ?? ''));
                        $distName = $districtAliasMap[$rawDist] ?? ucwords(strtolower($rawDist));
                        $muniName = trim($item['Local Level Name'] ?? '');
                        $type = trim($item['Type'] ?? 'Municipality');

                        if (! $muniName) {
                            continue;
                        }

                        $districtRow = DB::table('districts')->whereRaw('LOWER(name) = LOWER(?)', [$distName])->first();
                        if (! $districtRow) {
                            continue;
                        }

                        // Also check if short name exists (e.g. without 'Rural Municipality' or 'Municipality')
                        $existing = DB::table('municipalities')
                            ->where('district_id', $districtRow->id)
                            ->where(function ($q) use ($muniName) {
                                $q->where('name', $muniName);
                            })->first();

                        if (! $existing) {
                            DB::table('municipalities')->insert([
                                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                                'district_id' => $districtRow->id,
                                'name' => $muniName,
                                'type' => strtolower(str_replace(' ', '_', $type)),
                                'ward_count' => 1,
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }
    }
}
