from app.database import engine, Base
from app.models import User, Design, Furniture, Booking, DesignAnalysisCache

print("Creating database file...")
Base.metadata.create_all(bind=engine)
print("Success! You should now see gruha_alankara.db in your folder.")
