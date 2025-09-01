import { forwardRef } from 'react';
import { QuoteDraft } from '@/types';

interface PdfTemplateProps {
  quoteDraft: QuoteDraft;
  totalPrice: number;
}

export const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(
  ({ quoteDraft, totalPrice }, ref) => {
    const formatPrice = (price: number | null) => {
      if (price === null) return '';
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR'
      }).format(price);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('nl-NL');
    };

    return (
      <div ref={ref} className="bg-white text-black p-8 font-sans text-sm leading-relaxed">
        {/* Header with Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">OFFERTE</h1>
        </div>

        {/* Company info and date/quote number */}
        <div className="flex justify-between mb-8">
          <div className="space-y-1">
            <div className="font-bold">De Vries Surface Technologies</div>
            <div>Aalbosweg 29-31</div>
            <div>8171 MA Vaassen</div>
            <div>Telefoon: 0578-573430</div>
            <div>E-mail: info@devries-st.nl</div>
            <div>Website: www.devries-st.nl</div>
          </div>
          
          <div className="text-right space-y-1">
            <div><strong>Datum:</strong> {formatDate(quoteDraft.meta.createdAt)}</div>
            <div><strong>Offertenummer:</strong> {quoteDraft.meta.quoteNumber}</div>
          </div>
        </div>

        {/* Introductory conditions */}
        <div className="mb-8 space-y-3">
          <p>
            Prijzen zijn geldig tot 1 maand na offertedatum. Prijzen zijn exclusief btw en onvoorziene verpakkingseisen.
          </p>
          <p>
            Mocht de offerte opdracht worden, gelieve dan de initiële omschrijving hanteren en/of refereren naar het hierboven genoemde offertenummer.
          </p>
          <p>
            Levertijd gaat in overleg. Daarnaast hanteren wij een minimale orderwaarde van €59,50.
          </p>
          <p>
            Delen zoals kokers, buizen etc. moeten vloeistofdicht afgelast zijn of goed doorspoelbaar. Dit geldt ook voor platen die koud op elkaar zitten. Wanneer delen erg vervuild zijn middels grove lasnaden, vetten, oliën e.d., dan zullen wij daar extra kosten voor in rekening moeten brengen.
          </p>
        </div>

        {/* Customer information */}
        <div className="mb-8">
          <div className="font-bold mb-2">Klant:</div>
          <div>T.a.v. {quoteDraft.meta.clientName}</div>
          {quoteDraft.meta.clientReference && (
            <div className="mt-2">
              <strong>Referentie:</strong> {quoteDraft.meta.clientReference}
            </div>
          )}
        </div>

        {/* Quote table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left bg-gray-100 font-bold w-16">Pos.</th>
                <th className="border border-black p-2 text-left bg-gray-100 font-bold">Artikelomschrijving</th>
                <th className="border border-black p-2 text-left bg-gray-100 font-bold w-32">Bewerking</th>
                <th className="border border-black p-2 text-center bg-gray-100 font-bold w-20">Aantal</th>
                <th className="border border-black p-2 text-right bg-gray-100 font-bold w-24">Stukprijs</th>
                <th className="border border-black p-2 text-right bg-gray-100 font-bold w-24">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quoteDraft.lineItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2">
                    <div>
                      <div className="font-medium">{item.description || item.fileName || '-'}</div>
                      {item.drawingNumber && (
                        <div className="text-xs text-gray-600 mt-1">
                          Tek.nr: {item.drawingNumber}
                        </div>
                      )}
                      {(item.lengte || item.breedte || item.hoogte) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Afmetingen: {item.lengte || '?'}x{item.breedte || '?'}x{item.hoogte || '?'}mm
                        </div>
                      )}
                      {item.gewichtKg && (
                        <div className="text-xs text-gray-600 mt-1">
                          Gewicht: {item.gewichtKg}kg
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-black p-2">-</td>
                  <td className="border border-black p-2 text-center">1</td>
                  <td className="border border-black p-2 text-right">{formatPrice(item.price)}</td>
                  <td className="border border-black p-2 text-right">{formatPrice(item.price)}</td>
                </tr>
              ))}
              
              {/* Total row */}
              <tr>
                <td colSpan={5} className="border border-black p-2 text-right font-bold">
                  Totaal exclusief BTW:
                </td>
                <td className="border border-black p-2 text-right font-bold">
                  {formatPrice(totalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-700 leading-normal">
          <p>
            Op al onze offertes, leveringen en inkopen zijn de Algemene voorwaarden en Algemene Inkoop- en (Onder)aannemingsvoorwaarden Vereniging ION van toepassing, welke zijn gedeponeerd ter griffie van de rechtbank Midden-Nederland, nummer 124/2014, op 17 juni 2014 en nummer 206/2014, op 7 november 2014. U kunt deze downloaden van onze website www.devries-st.nl
          </p>
        </div>
      </div>
    );
  }
);

PdfTemplate.displayName = 'PdfTemplate';