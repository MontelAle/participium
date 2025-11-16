# MinIO Integration Guide

## Panoramica
MinIO è stato integrato nel progetto per gestire l'upload e lo storage delle immagini dei report. È un object storage compatibile con S3, deployato tramite Docker.

## Configurazione

### Variabili d'Ambiente
Aggiungi le seguenti variabili al tuo file `.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=participium-reports
```

### Docker
MinIO è configurato in `compose.yml`:
- **API Port**: 9000 (accesso programmatico)
- **Console Port**: 9001 (interfaccia web amministrativa)
- **Volume**: `minio_data` per persistenza dei dati

## Accesso alla Console MinIO

Puoi accedere alla console web di MinIO su:
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

Dalla console puoi:
- Visualizzare i bucket
- Esplorare i file caricati
- Gestire le policy di accesso
- Monitorare l'utilizzo dello storage

## Funzionalità Implementate

### Upload Immagini nei Report
Quando si crea un report, è ora obbligatorio caricare da 1 a 3 immagini:

**Endpoint**: `POST /api/reports`
**Content-Type**: `multipart/form-data`

**Vincoli**:
- Minimo: 1 immagine
- Massimo: 3 immagini
- Formati supportati: JPEG, PNG, WebP
- Dimensione massima per file: 5MB

**Esempio con curl**:
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -F "title=Lampione rotto" \
  -F "description=Il lampione è rotto da 3 giorni" \
  -F "longitude=7.686864" \
  -F "latitude=45.070312" \
  -F "address=Via Roma 42, Torino" \
  -F "categoryId=cat_streetlight" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### Gestione Automatica
- **Upload**: Le immagini vengono caricate su MinIO con nomi univoci
- **Organizzazione**: I file sono organizzati in sottocartelle per report: `reports/{reportId}/{timestamp}-{filename}`
- **URL Pubblici**: Le immagini sono accessibili pubblicamente tramite URL diretti
- **Eliminazione**: Quando un report viene eliminato, anche le sue immagini vengono rimosse da MinIO

## Architettura

### MinioProvider
Servizio globale che gestisce tutte le operazioni con MinIO:

**Metodi principali**:
- `uploadFile(fileName, buffer, mimetype)`: Upload di un file
- `deleteFile(fileName)`: Eliminazione singolo file
- `deleteFiles(fileNames[])`: Eliminazione multipla
- `extractFileNameFromUrl(url)`: Estrae il nome del file dall'URL

**Inizializzazione automatica**:
- Crea il bucket se non esiste
- Configura la policy per accesso pubblico in lettura
- Verifica la connessione a MinIO

### Modifiche al Report

**Entity** (`Report`):
- Campo `images` rimane `string[]` ma ora contiene URL completi di MinIO

**DTO** (`CreateReportDto`):
- Rimosso il campo `images` (gestito via multipart)
- Le immagini vengono caricate tramite `FilesInterceptor`

**Controller** (`ReportsController`):
- Usa `@UseInterceptors(FilesInterceptor('images', 3))`
- Usa `@ApiConsumes('multipart/form-data')`
- Valida numero, tipo e dimensione dei file

**Service** (`ReportsService`):
- Integra `MinioProvider` per upload durante la creazione
- Elimina le immagini da MinIO quando un report viene cancellato

## Test e Sviluppo

### Avvio dei Container
```bash
cd apps/api
docker compose up -d
```

### Verifica dello Stato
```bash
docker ps
docker logs participium-minio
```

### Test dell'Upload
Usa la documentazione Swagger su `http://localhost:5000/api/docs` per testare l'upload:
1. Esegui il login
2. Naviga all'endpoint `POST /reports`
3. Clicca su "Try it out"
4. Compila i campi e carica le immagini
5. Verifica la risposta e gli URL delle immagini

### Visualizzazione Immagini
Gli URL delle immagini avranno il formato:
```
http://localhost:9000/participium-reports/reports/{reportId}/{timestamp}-{filename}
```

Puoi aprire questi URL direttamente nel browser per vedere le immagini.

## Produzione

Per l'ambiente di produzione, considera:

1. **Credenziali**: Cambia `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` con valori sicuri
2. **SSL/TLS**: Abilita `MINIO_USE_SSL=true` e configura certificati
3. **Backup**: Configura backup regolari del volume `minio_data`
4. **Monitoring**: Usa MinIO Prometheus metrics
5. **CDN**: Considera l'uso di un CDN per servire le immagini
6. **Limiti**: Implementa rate limiting per prevenire abusi

## Troubleshooting

### MinIO non si avvia
```bash
docker logs participium-minio
```

### Bucket non creato automaticamente
Verifica i log dell'applicazione NestJS all'avvio

### Errore di permessi
Verifica che la policy del bucket sia configurata correttamente dalla console MinIO

### Immagini non accessibili
- Verifica che la porta 9000 sia aperta
- Controlla che il bucket abbia policy pubblica in lettura
- Verifica gli URL generati nel database
